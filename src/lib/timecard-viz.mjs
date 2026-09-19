/**
 * Illustrative labor-efficiency donut for the Timecard Visualizer project card.
 *
 * Modeled on the real service's actual sunburst concept: three root buckets
 * (time that was billable, time that was necessary-but-not-billable, and pure
 * overhead), broken into work types under each, after reading its source with
 * Carlos, one repo over. The DATA below is entirely invented: three fictional
 * weekly scenarios with made-up hours for a handful of made-up work types.
 * Nothing here is FCP Insight's real timecard data, real work-type taxonomy,
 * or real numbers; see the on-card disclaimer.
 *
 * Isomorphic like chart-svg.mjs: TimecardMiniViz.astro imports this for the
 * build-time initial render, and the same file is imported client-side to
 * redraw when a visitor switches scenarios, so both paths draw identically.
 */

// Colors, validated with the dataviz skill's palette method, not eyeballed:
//   node validate_palette.js "#e0653a,#199e70,#3987e5" --mode dark \
//     --surface "#26201b" --pairs all
// PASS on all six checks (worst CVD ΔE 9.1, worst normal-vision ΔE 20.9). Slot
// 1 is the site's own accent, since "realized/billable" is the headline bucket
// and the accent already carries that "good outcome" meaning everywhere else
// on the page; the other two are validated alongside it, not matched by eye.
export const BUCKETS = [
  {
    key: "realized",
    label: "Realized",
    color: "#e0653a",
    hint: "Billable time on a completed job.",
  },
  {
    key: "utilized",
    label: "Utilized",
    color: "#199e70",
    hint: "Necessary but not directly billable: diagnostics, setup.",
  },
  {
    key: "reported",
    label: "Non-billable",
    color: "#3987e5",
    hint: "Admin, training, and other overhead.",
  },
];

// Three invented scenarios. Each leaf: { bucket, label, hours }. Numbers are
// made up to be plausible for a small field-service crew's week, nothing more.
export const SCENARIOS = {
  typical: {
    label: "Typical week",
    leaves: [
      { bucket: "realized", label: "Install", hours: 118 },
      { bucket: "realized", label: "Service call", hours: 74 },
      { bucket: "utilized", label: "Diagnostics", hours: 52 },
      { bucket: "utilized", label: "Travel & setup", hours: 61 },
      { bucket: "reported", label: "Admin", hours: 40 },
      { bucket: "reported", label: "Training", hours: 35 },
    ],
  },
  busy: {
    label: "Busy week",
    leaves: [
      { bucket: "realized", label: "Install", hours: 165 },
      { bucket: "realized", label: "Service call", hours: 95 },
      { bucket: "utilized", label: "Diagnostics", hours: 48 },
      { bucket: "utilized", label: "Travel & setup", hours: 58 },
      { bucket: "reported", label: "Admin", hours: 24 },
      { bucket: "reported", label: "Training", hours: 20 },
    ],
  },
  slow: {
    label: "Slow week",
    leaves: [
      { bucket: "realized", label: "Install", hours: 78 },
      { bucket: "realized", label: "Service call", hours: 52 },
      { bucket: "utilized", label: "Diagnostics", hours: 40 },
      { bucket: "utilized", label: "Travel & setup", hours: 55 },
      { bucket: "reported", label: "Admin", hours: 58 },
      { bucket: "reported", label: "Training", hours: 57 },
    ],
  },
};

const TAU = Math.PI * 2;
const START = -Math.PI / 2; // 12 o'clock

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function annularPath(cx, cy, rOuter, rInner, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, rOuter, a0);
  const [x1, y1] = polar(cx, cy, rOuter, a1);
  const [x2, y2] = polar(cx, cy, rInner, a1);
  const [x3, y3] = polar(cx, cy, rInner, a0);
  return [
    `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** Bucket totals + each leaf's [start,end) angle, nested within its bucket's span. */
export function computeLayout(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey] ?? SCENARIOS.typical;
  const total = scenario.leaves.reduce((s, l) => s + l.hours, 0);

  const bucketTotals = BUCKETS.map((b) => ({
    ...b,
    hours: scenario.leaves.filter((l) => l.bucket === b.key).reduce((s, l) => s + l.hours, 0),
  }));

  const bucketGap = 0.035; // radians between the 3 root arcs
  const leafGap = 0.018; // radians between leaf arcs within one bucket
  let cursor = START;
  const bucketArcs = [];
  const leafArcs = [];

  for (const bucket of bucketTotals) {
    const span = (bucket.hours / total) * TAU;
    const a0 = cursor + bucketGap / 2;
    const a1 = cursor + span - bucketGap / 2;
    bucketArcs.push({ ...bucket, a0, a1, pctTotal: bucket.hours / total });

    const leaves = scenario.leaves.filter((l) => l.bucket === bucket.key);
    let leafCursor = cursor;
    for (const leaf of leaves) {
      const leafSpan = (leaf.hours / total) * TAU;
      leafArcs.push({
        ...leaf,
        color: bucket.color,
        a0: leafCursor + leafGap / 2,
        a1: leafCursor + leafSpan - leafGap / 2,
        pctTotal: leaf.hours / total,
        pctParent: leaf.hours / bucket.hours,
      });
      leafCursor += leafSpan;
    }
    cursor += span;
  }

  return { total, scenarioLabel: scenario.label, bucketArcs, leafArcs, leaves: scenario.leaves };
}

const fmtHrs = (h) => `${h}h`;
const fmtPct = (p) => `${(p * 100).toFixed(0)}%`;

/** Full inline-SVG donut, sized for a project-card slot. */
export function donutSVG(scenarioKey) {
  const { total, bucketArcs, leafArcs } = computeLayout(scenarioKey);
  const cx = 130;
  const cy = 130;
  const rBucketOuter = 92;
  const rBucketInner = 66;
  const rLeafOuter = 128;
  const rLeafInner = 98;

  const bucketPaths = bucketArcs
    .map(
      (b) => `<path d="${annularPath(cx, cy, rBucketOuter, rBucketInner, b.a0, b.a1)}"
        fill="${b.color}" data-kind="bucket" data-key="${b.key}"
        data-label="${b.label}" data-hours="${b.hours}" data-pct="${fmtPct(b.pctTotal)}"
        tabindex="0" role="img" aria-label="${b.label}: ${fmtHrs(b.hours)}, ${fmtPct(b.pctTotal)} of the week"></path>`,
    )
    .join("\n");

  const leafPaths = leafArcs
    .map((l) => {
      const wide = l.a1 - l.a0 > 0.35; // ~20deg, enough room for a direct label
      const [lx, ly] = polar(cx, cy, (rLeafOuter + rLeafInner) / 2, (l.a0 + l.a1) / 2);
      const label = wide
        ? `<text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
             class="leaf-label" fill="#17130f" font-size="9" font-weight="600">${l.label}</text>`
        : "";
      return `<path d="${annularPath(cx, cy, rLeafOuter, rLeafInner, l.a0, l.a1)}"
          fill="${l.color}" opacity="0.72" data-kind="leaf" data-bucket="${l.bucket}"
          data-label="${l.label}" data-hours="${l.hours}" data-pct-total="${fmtPct(l.pctTotal)}"
          data-pct-parent="${fmtPct(l.pctParent)}"
          tabindex="0" role="img" aria-label="${l.label}: ${fmtHrs(l.hours)}, ${fmtPct(l.pctParent)} of its bucket"></path>${label}`;
    })
    .join("\n");

  return `<svg viewBox="0 0 260 260" class="donut-svg" role="group" aria-label="Weekly labor-hours breakdown, illustrative data">
    ${leafPaths}
    ${bucketPaths}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="donut-total" font-size="22" font-weight="700">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-total-label" font-size="10">hours / wk</text>
  </svg>`;
}

/** The legend + "show the numbers" table, kept as real DOM text (not just SVG)
 *  so the breakdown is readable without hovering and without color vision.
 *  `legend` is bare <li> markup; the caller supplies the wrapping <ul>, so
 *  this can be dropped into an existing list via innerHTML without nesting
 *  a second <ul> inside it. */
export function legendHTML(scenarioKey) {
  const { bucketArcs, leafArcs } = computeLayout(scenarioKey);
  const legend = bucketArcs
    .map(
      (b) => `<li class="legend-item">
        <span class="swatch" style="background:${b.color}"></span>
        <span class="legend-text">
          <span class="legend-label">${b.label}</span>
          <span class="legend-hint">${b.hint}</span>
        </span>
        <span class="legend-value">${fmtHrs(b.hours)} · ${fmtPct(b.pctTotal)}</span>
      </li>`,
    )
    .join("");

  const rows = leafArcs
    .map(
      (l) =>
        `<tr><td>${l.label}</td><td>${BUCKETS.find((b) => b.key === l.bucket).label}</td><td class="num">${fmtHrs(l.hours)}</td><td class="num">${fmtPct(l.pctTotal)}</td></tr>`,
    )
    .join("");

  return {
    legend,
    table: `<table><thead><tr><th>Work type</th><th>Bucket</th><th class="num">Hours</th><th class="num">% of week</th></tr></thead><tbody>${rows}</tbody></table>`,
  };
}
