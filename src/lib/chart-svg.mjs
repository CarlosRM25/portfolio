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

// Bars flip to horizontal past these — see pickOrientation().
const MANY_BARS = 8;
const LONG_LABEL = 14;
// Past this many bars the chart is a comb of hairlines nobody can read. The
// rest stay reachable in the table view, and the figure says so out loud.
const MAX_BARS = 20;
const CAT_LABEL_MAX = 36;
const ROW_H = 26; // one horizontal bar's slot
const CHAR_W = 5.9; // ~11px system sans — enough to reserve label space by

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

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

const numericish = (categories) =>
  categories.every((c) => /^-?[\d,. ]+$/.test(c));

/**
 * Vertical bars only work while the category labels fit side by side. Past a
 * handful of bars — or once the categories are building names rather than
 * years — the labels overlap into a smear. Horizontal bars give each name a
 * line of its own.
 */
function pickOrientation(isBar, categories) {
  if (!isBar || numericish(categories)) return "v";
  const longest = Math.max(...categories.map((c) => c.length));
  return categories.length > MANY_BARS || longest > LONG_LABEL ? "h" : "v";
}

export function chartHTML(spec, opts = {}) {
  if (!spec || !Array.isArray(spec.series) || !spec.series.length) return "";

  const allSeries = spec.series;
  const isBar = allSeries.some((s) => s.type === "bar");
  const allCategories = allSeries[0].x.map((v) => String(v));
  if (!allCategories.length) return "";
  const orient = pickOrientation(isBar, allCategories);

  // Keep the agent's own ordering — its SQL already chose one, and re-sorting
  // here would put the chart at odds with the title the agent wrote.
  const total = allCategories.length;
  const capped = orient === "h" && total > MAX_BARS;
  const shown = capped ? MAX_BARS : total;
  const categories = allCategories.slice(0, shown);
  const series = allSeries.map((s) => ({ ...s, y: s.y.slice(0, shown) }));

  const drawn = series.flatMap((s) => s.y).filter((v) => Number.isFinite(v));
  if (!drawn.length) return "";
  const allValues = allSeries.flatMap((s) => s.y).filter((v) => Number.isFinite(v));
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  // Bars must be read against zero. A line over time may sit on its own range,
  // which is also the range the agent's own chart showed.
  const lowBound = isBar ? Math.min(0, Math.min(...drawn)) : Math.min(...drawn);
  const { ticks, lo, hi } = niceTicks(lowBound, Math.max(...drawn));
  const frac = (v) => (v - lo) / (hi - lo || 1);

  const xTitle = humanizeLabel(spec.xTitle);
  const yTitle = humanizeLabel(spec.yTitle);
  const n = categories.length;
  const parts = [];

  let vbHeight;
  let plot;
  let hover = null;

  if (orient === "h") {
    // Category names run down the left, so reserve real space for them.
    const labels = categories.map((c) => truncate(c, CAT_LABEL_MAX));
    const widest = Math.max(...labels.map((l) => l.length));
    const left = Math.round(Math.min(250, Math.max(90, widest * CHAR_W + 14)));
    const right = 74; // room for the value at the end of each bar
    const top = 10;
    const bottom = yTitle ? 46 : 30;

    vbHeight = top + n * ROW_H + bottom;
    plot = { left, right: VB_W - right, top, bottom: vbHeight - bottom };
    const plotW = plot.right - plot.left;
    const xOf = (v) => plot.left + frac(v) * plotW;
    const rowMid = (i) => top + i * ROW_H + ROW_H / 2;

    for (const t of ticks) {
      const x = xOf(t);
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${plot.top}" x2="${x.toFixed(1)}" y2="${plot.bottom}" class="grid" />`,
        `<text x="${x.toFixed(1)}" y="${plot.bottom + 18}" class="tick tick-x">${esc(formatValue(t))}</text>`,
      );
    }

    categories.forEach((name, i) => {
      const label = labels[i];
      // A truncated name keeps its full text in a native SVG tooltip.
      const title = label === name ? "" : `<title>${esc(name)}</title>`;
      parts.push(
        `<text x="${plot.left - 10}" y="${rowMid(i)}" class="tick tick-y" dominant-baseline="middle">${title}${esc(label)}</text>`,
      );
    });

    const zeroX = xOf(Math.max(lo, 0));
    const slot = ROW_H / series.length;
    // Leave real air between rows — a stack of near-touching slabs reads loud.
    const barH = Math.max(3, slot - (series.length > 1 ? 3 : 11));

    series.forEach((s, si) => {
      const color = SERIES_COLORS[si % SERIES_COLORS.length];
      s.y.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        const end = xOf(v);
        const x = Math.min(end, zeroX);
        const w = Math.max(2, Math.abs(end - zeroX));
        const y = top + i * ROW_H + si * slot + (slot - barH) / 2;
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="${color}" />`,
        );
        // One series -> every bar carries its own value, so there is nothing
        // left for a tooltip to reveal. More than one and they would collide.
        if (series.length === 1) {
          parts.push(
            `<text x="${(end + 7).toFixed(1)}" y="${rowMid(i)}" class="bar-value" dominant-baseline="middle">${esc(formatValue(v))}</text>`,
          );
        }
      });
    });

    // The value axis is the x axis now, so the axis titles swap places.
    if (yTitle) {
      parts.push(
        `<text x="${((plot.left + plot.right) / 2).toFixed(1)}" y="${vbHeight - 8}" class="axis-title">${esc(yTitle)}</text>`,
      );
    }
  } else {
    // Upright bars and lines. Long labels tilt rather than overlap.
    const longest = Math.max(...categories.map((c) => c.length));
    const tilt = longest > 8 && !numericish(categories);
    const bottom = tilt ? Math.round(Math.min(120, 44 + longest * 4.4)) : 46;

    vbHeight = VB_H + (tilt ? bottom - 46 : 0);
    plot = { left: 64, right: VB_W - 28, top: 18, bottom: vbHeight - bottom };
    const plotW = plot.right - plot.left;
    const plotH = plot.bottom - plot.top;
    const yOf = (v) => plot.bottom - frac(v) * plotH;
    const band = plotW / Math.max(n, 1);
    const xOf = (i) =>
      isBar
        ? plot.left + band * (i + 0.5)
        : plot.left + (n > 1 ? (plotW * i) / (n - 1) : plotW / 2);

    for (const t of ticks) {
      const y = yOf(t);
      parts.push(
        `<line x1="${plot.left}" y1="${y.toFixed(1)}" x2="${plot.right}" y2="${y.toFixed(1)}" class="grid" />`,
        `<text x="${plot.left - 10}" y="${(y + 4).toFixed(1)}" class="tick tick-y">${esc(formatValue(t))}</text>`,
      );
    }

    // Thin the ticks by how much room a label needs, not just by how many.
    const perLabel = Math.max(28, longest * CHAR_W + 12);
    const stride = tilt ? 1 : Math.max(1, Math.ceil((n * perLabel) / plotW));
    categories.forEach((label, i) => {
      if (i % stride !== 0 && i !== n - 1) return;
      const x = xOf(i);
      const text = esc(truncate(label, 22));
      parts.push(
        tilt
          ? `<text transform="translate(${x.toFixed(1)} ${plot.bottom + 16}) rotate(-38)" class="tick tick-tilt">${text}</text>`
          : `<text x="${x.toFixed(1)}" y="${plot.bottom + 22}" class="tick tick-x">${text}</text>`,
      );
    });

    series.forEach((s, si) => {
      const color = SERIES_COLORS[si % SERIES_COLORS.length];

      if (isBar) {
        const gap = 2;
        // Cap the group so a handful of categories don't become slabs.
        const groupW = Math.min(band - gap * 2, band * 0.62, 64);
        const barW = Math.max(2, groupW / series.length - (series.length > 1 ? gap : 0));
        const zero = yOf(Math.max(lo, 0));
        s.y.forEach((v, i) => {
          if (!Number.isFinite(v)) return;
          const y = yOf(v);
          const topY = Math.min(y, zero);
          const h = Math.max(2, Math.abs(zero - y));
          const x = xOf(i) - groupW / 2 + si * (barW + gap);
          parts.push(
            `<rect x="${x.toFixed(1)}" y="${topY.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${color}" />`,
          );
        });
        return;
      }

      const pts = s.y
        .map((v, i) =>
          Number.isFinite(v) ? `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}` : null,
        )
        .filter(Boolean);
      if (!pts.length) return;

      if (series.length === 1) {
        const first = pts[0].split(",")[0];
        const last = pts[pts.length - 1].split(",")[0];
        parts.push(
          `<path d="M${first},${plot.bottom} L${pts.join(" L")} L${last},${plot.bottom} Z" fill="${color}" opacity="0.09" />`,
        );
      }
      parts.push(
        `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`,
      );
      s.y.forEach((v, i) => {
        if (!Number.isFinite(v)) return;
        parts.push(
          `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--chart-surface)" stroke-width="2" />`,
        );
      });

      // Direct-label the endpoint only — the axis and hover layer carry the rest.
      const lastIdx = s.y.length - 1;
      const lastVal = s.y[lastIdx];
      if (Number.isFinite(lastVal)) {
        parts.push(
          `<text x="${(xOf(lastIdx) - 2).toFixed(1)}" y="${(yOf(lastVal) - 12).toFixed(1)}" class="endpoint">${esc(formatValue(lastVal))}</text>`,
        );
      }
    });

    if (xTitle) {
      parts.push(
        `<text x="${((plot.left + plot.right) / 2).toFixed(1)}" y="${vbHeight - 6}" class="axis-title">${esc(xTitle)}</text>`,
      );
    }
    if (yTitle) {
      parts.push(
        `<text transform="translate(14 ${((plot.top + plot.bottom) / 2).toFixed(1)}) rotate(-90)" class="axis-title">${esc(yTitle)}</text>`,
      );
    }

    // Geometry the page script needs to attach the crosshair + tooltip.
    hover = JSON.stringify({
      x: Array.from({ length: n }, (_, i) => Number(xOf(i).toFixed(1))),
      labels: categories,
      top: plot.top,
      bottom: plot.bottom,
      vbWidth: VB_W,
      xTitle,
      series: series.map((s, i) => ({
        name: series.length > 1 ? humanizeLabel(s.name) : yTitle || "Value",
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        values: s.y.map((v) => (Number.isFinite(v) ? formatValue(v) : "—")),
      })),
    });
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

  // Table view: every value stays reachable without hover and without colour —
  // and it is where the rows a capped chart left out still live.
  const valueHeader = (s) =>
    esc(allSeries.length > 1 ? humanizeLabel(s.name) : yTitle || "Value");
  const table = `<div class="table-scroll"><table><thead><tr><th>${esc(xTitle || "Category")}</th>${allSeries
    .map((s) => `<th>${valueHeader(s)}</th>`)
    .join("")}</tr></thead><tbody>${allCategories
    .map(
      (c, i) =>
        `<tr><td>${esc(c)}</td>${allSeries
          .map((s) => `<td>${esc(formatValue(s.y[i]))}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;

  const note = capped
    ? `<p class="chart-note">Charting the first ${shown} of ${total} rows — all ${total} are under “Show the numbers”.</p>`
    : "";

  const summary =
    `${yTitle || "Values"} by ${xTitle || "category"}. ` +
    (capped ? `First ${shown} of ${total} rows charted. ` : "") +
    `${allCategories[0]} to ${allCategories[total - 1]}, ` +
    `ranging ${formatValue(dataMin)} to ${formatValue(dataMax)}.`;

  const caption = spec.title ? `<figcaption>${esc(spec.title)}</figcaption>` : "";
  const plotAttrs = hover ? ` data-chart="${esc(hover)}"` : "";
  const crosshair = hover
    ? `\n      <line class="crosshair" x1="0" x2="0" y1="${plot.top}" y2="${plot.bottom}" hidden />`
    : "";

  return `<figure class="chart chart--${orient}"${opts.id ? ` id="${esc(opts.id)}"` : ""}>
  ${caption}
  <div class="chart-plot"${plotAttrs}>
    <svg viewBox="0 0 ${VB_W} ${Math.round(vbHeight)}" role="img" aria-label="${esc(summary)}" preserveAspectRatio="xMidYMid meet">
      ${parts.join("\n      ")}${crosshair}
    </svg>
    <div class="chart-tip" hidden></div>
  </div>
  ${note}
  ${legend}
  <details class="chart-data"><summary>Show the numbers</summary>${table}</details>
</figure>`;
}
