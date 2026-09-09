/**
 * /demo client behaviour: the chart hover layer, and the live "ask your own"
 * panel.
 *
 * Both the pre-run gallery and live answers go through the same renderers
 * (answer-md, plotly-figure, chart-svg), so an answer that arrives from Cloud
 * Run is drawn exactly like the eight that shipped with the page.
 */
import { renderAnswer, escapeHTML } from "../lib/answer-md";
import { extractFigure } from "../lib/plotly-figure";
import { chartHTML } from "../lib/chart-svg";

/* ---------------------------------------------------------------------------
   Chart hover — crosshair + value readout, keyboard included.
   The geometry comes from the data-chart attribute chart-svg.mjs wrote.
   --------------------------------------------------------------------------- */

interface HoverConfig {
  x: number[];
  labels: string[];
  top: number;
  bottom: number;
  vbWidth: number;
  xTitle: string;
  series: { name: string; color: string; values: string[] }[];
}

function enhanceCharts(root: ParentNode = document): void {
  const plots = root.querySelectorAll<HTMLElement>(".chart-plot[data-chart]");

  plots.forEach((plot) => {
    if (plot.dataset.enhanced) return;
    plot.dataset.enhanced = "1";

    let config: HoverConfig;
    try {
      config = JSON.parse(plot.dataset.chart!) as HoverConfig;
    } catch {
      return;
    }

    const svg = plot.querySelector("svg");
    const crosshair = plot.querySelector<SVGLineElement>(".crosshair");
    const tip = plot.querySelector<HTMLElement>(".chart-tip");
    if (!svg || !crosshair || !tip || !config.x.length) return;

    // The chart becomes a focusable widget so keyboard users get the readout.
    plot.tabIndex = 0;
    plot.setAttribute("role", "group");
    plot.setAttribute(
      "aria-label",
      "Chart. Use the left and right arrow keys to read each value.",
    );

    let active = -1;

    const hide = () => {
      active = -1;
      crosshair.setAttribute("hidden", "");
      tip.hidden = true;
    };

    const show = (index: number) => {
      const i = Math.max(0, Math.min(config.x.length - 1, index));
      active = i;

      const vbX = config.x[i];
      crosshair.setAttribute("x1", String(vbX));
      crosshair.setAttribute("x2", String(vbX));
      crosshair.removeAttribute("hidden");

      const rows = config.series
        .map(
          (s) =>
            `<div><span class="tip-value">${escapeHTML(s.values[i] ?? "—")}</span>` +
            (config.series.length > 1
              ? ` <span class="tip-label">${escapeHTML(s.name)}</span>`
              : "") +
            `</div>`,
        )
        .join("");
      tip.innerHTML =
        `<div class="tip-label">${escapeHTML(config.labels[i] ?? "")}</div>${rows}`;
      tip.hidden = false;

      // viewBox units -> rendered px. The SVG is width:100%/height:auto with a
      // uniform aspect ratio, so one scale factor covers both axes.
      const svgBox = svg.getBoundingClientRect();
      const plotBox = plot.getBoundingClientRect();
      const scale = svgBox.width / config.vbWidth;
      const offsetX = svgBox.left - plotBox.left;
      const offsetY = svgBox.top - plotBox.top;

      const half = tip.offsetWidth / 2;
      const left = offsetX + vbX * scale;
      tip.style.left = `${Math.min(Math.max(left, half), plotBox.width - half)}px`;
      tip.style.top = `${offsetY + config.top * scale - 8}px`;
    };

    const nearest = (clientX: number) => {
      const box = svg.getBoundingClientRect();
      const vbX = ((clientX - box.left) / box.width) * config.vbWidth;
      let best = 0;
      let bestDistance = Infinity;
      config.x.forEach((x, i) => {
        const distance = Math.abs(x - vbX);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    };

    plot.addEventListener("pointermove", (event) => show(nearest(event.clientX)));
    plot.addEventListener("pointerleave", hide);
    plot.addEventListener("blur", hide);
    plot.addEventListener("focus", () => show(active === -1 ? 0 : active));
    plot.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (step) {
        event.preventDefault();
        show((active === -1 ? 0 : active) + step);
      } else if (event.key === "Escape") {
        hide();
      }
    });
  });
}

/* ---------------------------------------------------------------------------
   Live answers
   --------------------------------------------------------------------------- */

interface AskStep {
  tool: string;
  sql?: string;
  chart_url?: string;
}

interface AskResponse {
  answer?: string;
  steps?: AskStep[];
  usage?: { tokens?: number; cost_usd?: number; latency_ms?: number };
  stopped?: string;
  cached?: boolean;
  disabled?: boolean;
  limited?: boolean;
  scope?: "visitor" | "global";
  error?: string;
}

const REQUEST_TIMEOUT_MS = 120_000;

function noticeHTML(text: string): string {
  return `<p class="rounded-lg border border-accent/25 bg-accent-subtle px-4 py-3 text-sm text-accent-text">${escapeHTML(text)}</p>`;
}

/** The tools the model actually reached for, in the order it reached for them. */
function traceHTML(steps: AskStep[]): string {
  const tools = steps.map((s) => s.tool).filter(Boolean);
  if (!tools.length) return "";
  return (
    `<div class="mt-5 flex flex-wrap items-center gap-1.5 text-xs text-faint">` +
    `<span class="uppercase tracking-wide">Tools called</span>` +
    tools
      .map(
        (tool) =>
          `<code class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-accent-text">${escapeHTML(tool)}</code>`,
      )
      .join(`<span aria-hidden="true">→</span>`) +
    `</div>`
  );
}

function answerHTML(data: AskResponse, elapsedSeconds: string): string {
  const steps = data.steps ?? [];
  const queries = steps.map((s) => s.sql).filter((sql): sql is string => Boolean(sql));
  const chartUrl = steps.map((s) => s.chart_url).find(Boolean);
  const figure = chartUrl ? extractFigure(chartUrl) : null;

  const usage = data.usage ?? {};
  const meta = [
    data.cached ? "cached" : null,
    typeof usage.tokens === "number" ? `${usage.tokens.toLocaleString()} tokens` : null,
    typeof usage.cost_usd === "number" ? `$${usage.cost_usd.toFixed(4)}` : null,
    `${elapsedSeconds}s`,
  ].filter(Boolean);

  let html = `<p class="text-xs uppercase tracking-wider text-faint">Answer</p>`;
  html += `<div class="mt-3 answer-prose">${renderAnswer(data.answer ?? "(no answer)")}</div>`;
  if (figure) html += chartHTML(figure);
  html += traceHTML(steps);
  if (queries.length) {
    html +=
      `<details class="sql-panel"><summary>The SQL it wrote${queries.length > 1 ? ` (${queries.length} queries)` : ""}</summary>` +
      queries.map((sql) => `<pre>${escapeHTML(sql.trim())}</pre>`).join("") +
      `</details>`;
  }
  html += `<p class="mt-5 border-t border-border pt-4 text-xs text-faint">${escapeHTML(meta.join(" · "))}</p>`;
  return html;
}

function initAsk(): void {
  const form = document.getElementById("ask-form") as HTMLFormElement | null;
  const thread = document.getElementById("ask-thread");
  const input = document.getElementById("ask-input") as HTMLInputElement | null;
  const submit = document.getElementById("ask-submit") as HTMLButtonElement | null;
  if (!form || !thread || !input || !submit) return;

  const apiBase = form.dataset.apiBase ?? "";

  document.querySelectorAll<HTMLButtonElement>("[data-suggestion]").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.suggestion ?? "";
      form.requestSubmit();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || submit.disabled) return;

    input.value = "";
    submit.disabled = true;

    const exchange = document.createElement("article");
    exchange.className = "rounded-xl border border-border bg-surface p-5 md:p-7";
    exchange.innerHTML =
      `<p class="text-xs uppercase tracking-wider text-faint">Question</p>` +
      `<p class="mt-1.5 text-base font-medium leading-relaxed text-heading">${escapeHTML(question)}</p>` +
      `<hr class="my-5 border-border" />` +
      `<div class="answer-slot" aria-live="polite">` +
      `<p class="flex items-center gap-2 text-sm text-muted"><span class="spinner" aria-hidden="true"></span> Planning, querying, answering…</p>` +
      `</div>`;
    thread.prepend(exchange);

    const slot = exchange.querySelector<HTMLElement>(".answer-slot")!;
    const started = performance.now();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiBase}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      const data = (await response.json()) as AskResponse;

      if (data.disabled) {
        slot.innerHTML = noticeHTML(
          "The live demo is paused right now. The eight examples above are real runs and still work.",
        );
      } else if (data.limited || response.status === 429) {
        slot.innerHTML = noticeHTML(
          data.scope === "global"
            ? "The demo has hit its question limit for today. Try again tomorrow — the examples above are always available."
            : "You've used up your questions for now. The examples above are always available.",
        );
      } else if (data.error) {
        slot.innerHTML = noticeHTML(`The agent returned an error: ${data.error}`);
      } else {
        const elapsed = ((performance.now() - started) / 1000).toFixed(1);
        slot.innerHTML = answerHTML(data, elapsed);
        enhanceCharts(slot);
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      slot.innerHTML = noticeHTML(
        aborted
          ? "That took longer than two minutes, so I stopped waiting. Try a narrower question."
          : "Couldn't reach the agent — it may be asleep or offline. The examples above still work.",
      );
    } finally {
      window.clearTimeout(timer);
      submit.disabled = false;
      input.focus();
    }
  });
}

enhanceCharts();
initAsk();
