/**
 * Draw a figure spec (from plotly-figure.mjs) as inline SVG.
 *
 * Why hand-rolled rather than a chart library: these charts have to render on
 * a static page with no network — that's the whole promise of the gallery —
 * and they have to sit on the site's dark surface without looking bolted on.
 * The shapes involved are a line and a bar; a 4 MB dependency to draw them is
 * a bad trade.
 *
 * Returns an HTML string so the same code can run at build time (the gallery)
 * and in the browser (live answers). The hover layer is attached separately by
 * the page script, off the `data-chart` attribute written here.
 */

// Slot 1 is the site accent; the rest are the standard categorical order with
// orange dropped (too near the accent). Validated on --color-surface for the
// lightness band, chroma floor, CVD separation and 3:1 contrast.
const SERIES_COLORS = [
  "var(--color-accent)",
  "#3987e5",
  "#199e70",
  "#c98500",
  "#d55181",
  "#9085e9",
];

const VB_W = 760;
const VB_H = 340;
const PAD = { top: 18, right: 28, bottom: 46, left: 64 };
const PLOT = {
  left: PAD.left,
  right: VB_W - PAD.right,
  top: PAD.top,
  bottom: VB_H - PAD.bottom,
};
const PLOT_W = PLOT.right - PLOT.left;
const PLOT_H = PLOT.bottom - PLOT.top;

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

export function formatValue(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return String(v);
  const abs = Math.abs(v);
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  if (abs >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (abs >= 10) return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** `avg_site_eui_wn` -> `Average site EUI (weather-normalized)`. */
const TERMS = {
  avg: "Average",
  num: "Number of",
  cnt: "Number of",
  wn: "(weather-normalized)",
  ghg: "GHG",
  eui: "EUI",
  co2: "CO₂",
  kgco2e: "kg CO₂e",
  sf: "sq ft",
  sqft: "sq ft",
  pct: "%",
  id: "ID",
  yr: "year",
};

export function humanizeLabel(raw) {
  if (!raw) return "";
  const words = String(raw)
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => TERMS[w.toLowerCase()] ?? w);
  const joined = words.join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/** A tick step that lands on 1 / 2 / 5 x 10^n. */
function niceTicks(min, max, target = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ticks: [0, 1], lo: 0, hi: 1 };
  }
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad / 2;
    max += pad / 2;
  }
  const raw = (max - min) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  // Rebuild each tick from the step to keep float drift from accumulating.
  for (let i = 0; lo + i * step <= hi + step / 1000; i++) {
    ticks.push(Number((lo + i * step).toPrecision(12)));
  }
  return { ticks, lo, hi };
}

export function chartHTML(spec, opts = {}) {
  if (!spec || !Array.isArray(spec.series) || !spec.series.length) return "";

  const series = spec.series;
  const isBar = series.some((s) => s.type === "bar");
  const n = Math.max(...series.map((s) => s.x.length));
  const categories = series[0].x.map((v) => String(v));

  const values = series.flatMap((s) => s.y).filter((v) => Number.isFinite(v));
  if (!values.length) return "";
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // Bars must be read against zero. A line over time may sit on its own range,
  // which is also the range the agent's own chart showed.
  const lowBound = isBar ? Math.min(0, dataMin) : dataMin;
  const { ticks, lo, hi } = niceTicks(lowBound, dataMax);

  const yPos = (v) => PLOT.bottom - ((v - lo) / (hi - lo || 1)) * PLOT_H;
  // Lines sample the full width; bars sit in the middle of a band.
  const band = PLOT_W / Math.max(n, 1);
  const xPos = (i) =>
    isBar
      ? PLOT.left + band * (i + 0.5)
      : PLOT.left + (n > 1 ? (PLOT_W * i) / (n - 1) : PLOT_W / 2);

  const parts = [];

  // Recessive hairline grid + y tick labels.
  for (const t of ticks) {
    const y = yPos(t);
    parts.push(
      `<line x1="${PLOT.left}" y1="${y.toFixed(1)}" x2="${PLOT.right}" y2="${y.toFixed(1)}" class="grid" />`,
      `<text x="${PLOT.left - 10}" y="${(y + 4).toFixed(1)}" class="tick tick-y">${esc(formatValue(t))}</text>`,
    );
  }

  // X tick labels, thinned so they never collide.
  const stride = Math.max(1, Math.ceil(n / 12));
  categories.forEach((label, i) => {
    if (i % stride !== 0 && i !== n - 1) return;
    parts.push(
      `<text x="${xPos(i).toFixed(1)}" y="${PLOT.bottom + 22}" class="tick tick-x">${esc(label)}</text>`,
    );
  });

  series.forEach((s, si) => {
    const color = SERIES_COLORS[si % SERIES_COLORS.length];

    if (isBar) {
      const gap = 2;
      const groupW = band - gap * 2;
      const barW = Math.max(2, groupW / series.length - (series.length > 1 ? gap : 0));
      const zero = yPos(Math.max(lo, 0));
      s.y.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        const y = yPos(v);
        const top = Math.min(y, zero);
        const h = Math.max(2, Math.abs(zero - y));
        const x = xPos(i) - groupW / 2 + si * (barW + gap);
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${color}" />`,
        );
      });
      return;
    }

    const pts = s.y
      .map((v, i) =>
        Number.isFinite(v) ? `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}` : null,
      )
      .filter(Boolean);
    if (!pts.length) return;

    if (series.length === 1) {
      const first = pts[0].split(",")[0];
      const last = pts[pts.length - 1].split(",")[0];
      parts.push(
        `<path d="M${first},${PLOT.bottom} L${pts.join(" L")} L${last},${PLOT.bottom} Z" fill="${color}" opacity="0.09" />`,
      );
    }
    parts.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`,
    );
    s.y.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      parts.push(
        `<circle cx="${xPos(i).toFixed(1)}" cy="${yPos(v).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--chart-surface)" stroke-width="2" />`,
      );
    });

    // Direct-label the endpoint only — the axis and hover layer carry the rest.
    const lastIdx = s.y.length - 1;
    const lastVal = s.y[lastIdx];
    if (Number.isFinite(lastVal)) {
      parts.push(
        `<text x="${(xPos(lastIdx) - 2).toFixed(1)}" y="${(yPos(lastVal) - 12).toFixed(1)}" class="endpoint">${esc(formatValue(lastVal))}</text>`,
      );
    }
  });

  const xTitle = humanizeLabel(spec.xTitle);
  const yTitle = humanizeLabel(spec.yTitle);
  if (xTitle) {
    parts.push(
      `<text x="${(PLOT.left + PLOT.right) / 2}" y="${VB_H - 6}" class="axis-title">${esc(xTitle)}</text>`,
    );
  }
  if (yTitle) {
    parts.push(
      `<text transform="translate(14 ${(PLOT.top + PLOT.bottom) / 2}) rotate(-90)" class="axis-title">${esc(yTitle)}</text>`,
    );
  }

  const legend =
    series.length > 1
      ? `<ul class="chart-legend">${series
          .map(
            (s, i) =>
              `<li><span class="swatch" style="background:${SERIES_COLORS[i % SERIES_COLORS.length]}"></span>${esc(humanizeLabel(s.name))}</li>`,
          )
          .join("")}</ul>`
      : "";

  // Table view: every value stays reachable without hover and without color.
  const valueHeader = (s) =>
    esc(series.length > 1 ? humanizeLabel(s.name) : yTitle || "Value");
  const table = `<div class="table-scroll"><table><thead><tr><th>${esc(xTitle || "Category")}</th>${series
    .map((s) => `<th>${valueHeader(s)}</th>`)
    .join("")}</tr></thead><tbody>${categories
    .map(
      (c, i) =>
        `<tr><td>${esc(c)}</td>${series
          .map((s) => `<td>${esc(formatValue(s.y[i]))}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;

  const summary =
    `${yTitle || "Values"} by ${xTitle || "category"}, ` +
    `${categories[0]} to ${categories[n - 1]}, ` +
    `ranging ${formatValue(dataMin)} to ${formatValue(dataMax)}.`;

  // Geometry the page script needs to attach the crosshair + tooltip.
  const hover = JSON.stringify({
    x: Array.from({ length: n }, (_, i) => Number(xPos(i).toFixed(1))),
    labels: categories,
    top: PLOT.top,
    bottom: PLOT.bottom,
    vbWidth: VB_W,
    xTitle,
    series: series.map((s, i) => ({
      name: series.length > 1 ? humanizeLabel(s.name) : yTitle || "Value",
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      values: s.y.map((v) => (Number.isFinite(v) ? formatValue(v) : "—")),
    })),
  });

  const caption = spec.title ? `<figcaption>${esc(spec.title)}</figcaption>` : "";

  return `<figure class="chart"${opts.id ? ` id="${esc(opts.id)}"` : ""}>
  ${caption}
  <div class="chart-plot" data-chart="${esc(hover)}">
    <svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="${esc(summary)}" preserveAspectRatio="xMidYMid meet">
      ${parts.join("\n      ")}
      <line class="crosshair" x1="0" x2="0" y1="${PLOT.top}" y2="${PLOT.bottom}" hidden />
    </svg>
    <div class="chart-tip" hidden></div>
  </div>
  ${legend}
  <details class="chart-data"><summary>Show the numbers</summary>${table}</details>
</figure>`;
}
