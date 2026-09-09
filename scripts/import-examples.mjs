/**
 * Import the agent's pre-run gallery into this site.
 *
 *   npm run examples [-- <path/to/examples.json>]
 *
 * Reads the agent repo's `frontend/examples.json` and writes
 * `src/data/examples.json`, which the /demo page imports at build time.
 *
 * The one real transformation is the charts. The agent emits each chart as a
 * `data:text/html` URI containing a full Plotly page that pulls ~4 MB of
 * plotly.js from a CDN and paints on a white ground — which would both break
 * the "works with zero network" promise of the gallery and punch white holes
 * in a dark page. So we pull the figure out of that HTML and store the plain
 * numbers instead; ChartFigure.astro renders them as inline SVG.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { extractFigure } from "../src/lib/plotly-figure.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SRC =
  process.argv[2] ??
  resolve(here, "../../analytics-agent/frontend/examples.json");
const OUT = resolve(here, "../src/data/examples.json");

const items = JSON.parse(readFileSync(SRC, "utf8"));
const out = items.map((it) => ({
  id: it.id,
  question: it.question,
  answer: it.answer,
  sql: it.sql ?? [],
  chart: it.chart ? extractFigure(it.chart) : null,
}));

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const charted = out.filter((o) => o.chart);
console.log(`wrote ${out.length} examples -> src/data/examples.json`);
for (const c of charted) {
  const s = c.chart.series[0];
  console.log(
    `  chart: "${c.chart.title}" (${c.chart.series.length} series, ${s.x.length} pts, ${s.type})`,
  );
}
