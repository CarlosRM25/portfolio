/**
 * Pull the plain numbers out of a Plotly chart.
 *
 * The agent hands charts over as a `data:text/html` URI containing a whole
 * Plotly page — a CDN <script> tag plus a `Plotly.newPlot(id, traces, layout)`
 * call. Rendering that in an iframe means ~4 MB over the wire per chart and a
 * white plot on a near-black page, so instead we lift the figure out and draw
 * it ourselves (see chart-svg.mjs).
 *
 * Shared by scripts/import-examples.mjs (build time, for the gallery) and the
 * /demo page's live panel (runtime, for answers from the backend), so the two
 * paths can't drift apart. Plain .mjs so both Node and Vite can load it.
 */

/** Plotly serialises numeric arrays as base64 of a little-endian typed array. */
const TYPED = {
  i1: Int8Array, u1: Uint8Array,
  i2: Int16Array, u2: Uint16Array,
  i4: Int32Array, u4: Uint32Array,
  f4: Float32Array, f8: Float64Array,
};

function base64ToBytes(b64) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function decodeArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object" && v.bdata) {
    const Ctor = TYPED[v.dtype];
    if (!Ctor) throw new Error(`unknown plotly dtype: ${v.dtype}`);
    const bytes = base64ToBytes(v.bdata);
    return Array.from(new Ctor(bytes.buffer, bytes.byteOffset, bytes.byteLength / Ctor.BYTES_PER_ELEMENT));
  }
  return [];
}

/** Read one balanced JSON value out of `s`, starting at `i` (a `[` or `{`). */
function readJSON(s, i) {
  const open = s[i];
  const close = open === "[" ? "]" : "}";
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) {
      return { value: JSON.parse(s.slice(i, j + 1)), end: j + 1 };
    }
  }
  throw new Error("unbalanced JSON in chart HTML");
}

function decodeDataURI(uri) {
  const comma = uri.indexOf(",");
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  if (!meta.includes("base64")) return decodeURIComponent(payload);
  const bytes = base64ToBytes(payload);
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * `data:text/html` Plotly page -> { title, xTitle, yTitle, series[] },
 * or null if it isn't one (so callers can fall back gracefully).
 */
export function extractFigure(chartUrl) {
  if (typeof chartUrl !== "string" || !chartUrl.startsWith("data:")) return null;
  let html;
  try {
    html = decodeDataURI(chartUrl);
  } catch {
    return null;
  }

  const call = html.indexOf("Plotly.newPlot(");
  if (call === -1) return null;

  try {
    const { value: traces, end } = readJSON(html, html.indexOf("[", call));
    const { value: layout } = readJSON(html, html.indexOf("{", end));

    const series = traces
      .map((t, i) => ({
        name: t.name || t.legendgroup || `Series ${i + 1}`,
        type: t.type === "bar" ? "bar" : "line",
        x: decodeArray(t.x),
        y: decodeArray(t.y),
      }))
      .filter((s) => s.x.length && s.x.length === s.y.length);

    if (!series.length) return null;

    return {
      title: layout?.title?.text ?? "",
      xTitle: layout?.xaxis?.title?.text ?? "",
      yTitle: layout?.yaxis?.title?.text ?? "",
      series,
    };
  } catch {
    return null;
  }
}
