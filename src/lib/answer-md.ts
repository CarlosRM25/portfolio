/**
 * The agent answers in a small, predictable subset of Markdown: GFM pipe
 * tables, ATX headings, bold, ordered/unordered lists, paragraphs. This turns
 * that into HTML.
 *
 * Deliberately not a general Markdown renderer — a real one is a dependency we
 * don't need, and this input is machine-generated and narrow. Everything is
 * escaped before any tag is emitted, so answers coming back from the live
 * backend are safe to inject.
 *
 * Used in two places: at build time by ExampleGallery.astro for the pre-run
 * gallery, and in the browser by the live "ask your own" panel.
 */

const escapeHTML = (s: string): string =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

/** Bold and `code`, on already-escaped text. */
const inline = (s: string): string =>
  escapeHTML(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/** `|---|:--:|` — the row that turns the line above it into a table header. */
const isTableRule = (line = ""): boolean =>
  line.includes("-") && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line);

const HEADING = /^\s{0,3}(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBER = /^\s*\d+[.)]\s+(.*)$/;

export function renderAnswer(markdown: string): string {
  const lines = String(markdown ?? "").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Table: a row of cells followed by a rule row.
    if (line.includes("|") && isTableRule(lines[i + 1])) {
      const head = cells(line);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        body.push(cells(lines[i++]));
      }
      const th = head.map((c) => `<th>${inline(c)}</th>`).join("");
      const rows = body
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("");
      out.push(
        `<div class="table-scroll"><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`,
      );
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      // Answers start their sections at "#"; the page already owns h1/h2, so
      // everything lands at h4 to keep the document outline sane.
      out.push(`<h4>${inline(heading[2])}</h4>`);
      i++;
      continue;
    }

    const listMatch = (l: string) => l.match(BULLET) ?? l.match(NUMBER);
    if (listMatch(line)) {
      const ordered = NUMBER.test(line) && !BULLET.test(line);
      const items: string[] = [];
      while (i < lines.length && lines[i].trim() && listMatch(lines[i])) {
        items.push(`<li>${inline(listMatch(lines[i])![1])}</li>`);
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block.
    const para: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const l = lines[i];
      if (HEADING.test(l) || listMatch(l) || isTableRule(lines[i + 1])) break;
      para.push(l.trim());
      i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}

export { escapeHTML };
