# Portfolio Site — build notes for Claude Code

Personal portfolio for Carlos Rubio-Marroquin. **Astro** static site, deployed on **Vercel**.
Scoped in the architecture chat; built in focused sessions. This file covers **the main page** and the **`/demo` agent page** (built 2026-09-08).

## Status
**v1 shipped** (2026-09-06). Astro 7.3 + Tailwind v4 (`@tailwindcss/vite`, CSS-first config in `src/styles/global.css`), static output. All components + `src/data/*.ts` in place per the spec below; `npm run build` is clean. Résumé PDF, GitHub + LinkedIn URLs wired in with Carlos's real values.

- **Repo:** https://github.com/CarlosRM25/portfolio (`main`)
- **Live:** https://portfolio-liart-rho-94.vercel.app — Vercel Hobby, auto-deploys on push to `main`. Random suffix because `portfolio` was taken; fine for v1 (custom domain is out of scope). Set as `site` in `astro.config.mjs`.

**`/demo` shipped** (2026-09-08) — the agent's example gallery plus the live "ask your own" panel, on the site's own chrome. See **"The AI-agent demo"** below.

**Agent backend deployed** (2026-09-08) — `PUBLIC_AGENT_API_URL` is set in Vercel, "ask your own" answers live, and the agent card is `status: "live"`. The placeholder Flask/CI-CD card was removed; the two FCP Insight systems replaced it.

**Next / optional:** thumbnails for all three project cards (`public/projects/*.png`) — FCP Insight's boss cleared images (and later, some code) from both systems on 2026-09-11, reversing the earlier text-only decision; images pending, see the TODOs in `projects.ts`. Prettier + `prettier-plugin-astro` not installed yet.

Dev: `npm run dev` → http://localhost:4321. Node note: a transitive dep (`undici`) wants Node ≥ 22.19; local is 22.14 — warning only, build unaffected. Vercel uses its own Node.

## Stack & conventions
- **Astro** (latest), **static output** — no SSR adapter. `/demo` calls the agent API client-side, so the site stays fully static.
- **TypeScript**, used lightly (data files, component props).
- **Tailwind** — add with `npx astro add tailwind`; don't hand-roll the config.
- Page data lives in `src/data/*.ts` (plain arrays/objects). Move to content collections only when project write-ups start.
- Formatting: Prettier + `prettier-plugin-astro`, 2-space indent.
- Node LTS (`node -v` ≥ 20).

## Repo layout (target)
```
portfolio/
  src/
    pages/index.astro         # THE MAIN PAGE — the whole site for v1
    layouts/BaseLayout.astro
    components/
      BaseHead.astro  SiteHeader.astro  SiteFooter.astro
      Hero.astro  ProjectList.astro  ProjectCard.astro  About.astro  SocialLinks.astro
      demo/AgentLoop.astro  demo/ExampleGallery.astro  demo/AskPanel.astro  demo/ChartFigure.astro
    pages/demo.astro          # the agent demo
    lib/answer-md.ts          # the agent's Markdown subset -> HTML
    lib/plotly-figure.mjs     # Plotly data: URI -> figure spec
    lib/chart-svg.mjs         # figure spec -> inline SVG (build time + runtime)
    scripts/demo.ts           # /demo client: chart hover + live ask
    data/profile.ts  data/projects.ts  data/examples.json
    styles/global.css  styles/demo.css
  public/
    resume.pdf                # Carlos exports a current one here
    favicon.svg
  scripts/import-examples.mjs # `npm run examples` — pulls the gallery from the agent repo
  astro.config.mjs  tsconfig.json  package.json
  CLAUDE.md                   # this file
```
`.claude/` and `Claude outputs/` already exist in this folder — see "Housekeeping".

## Related
- `Claude outputs/analytics-agent-architecture.md` — the AI-agent project that gets a `/demo` page here. Its **§10** defines how this frontend talks to the agent's Cloud Run backend (offline gallery first, live agent on click). Plan is **"The AI-agent demo"** below.

---

## The AI-agent demo — `/demo` page

**Goal:** the "Agentic Data-Analyst" project card links to a `/demo` page *on this site* where a recruiter reads pre-run examples and can ask the live agent a question. The backend is a separate thing (Flask on **Google Cloud Run**, repo `CarlosRM25/analytics-AI-Agent-`, local `../analytics-agent/`). This page is a static frontend that calls it over one `fetch`.

### Current state (2026-09-08)
**Live, both halves.** The agent is deployed on Cloud Run, `PUBLIC_AGENT_API_URL` is set in Vercel, and "ask your own" answers real questions. The gallery works with no network either way. See **"What was built"** for how the page differs from the original plan.
- Locally `PUBLIC_AGENT_API_URL` is unset unless you put it in `.env`, so `npm run dev` shows the "Examples only" state. That is the fallback working, not a bug.
- The agent repo's `frontend/index.html` + `frontend/examples.json` remain the reference and the source of the gallery.

### Decision — port it in (Option A)
Build `src/pages/demo.astro` in **this** repo, restyled to match the site (BaseLayout, header/footer, `--color-accent-*`, site fonts). Do **not** deploy the agent's `frontend/` separately or iframe it — the recruiter stays on the portfolio and the demo looks like the portfolio. The agent repo's `frontend/` stays as the reference and the source of `examples.json`.
*(Fallback, Option B: point `demoUrl` at a separately-hosted copy of `../analytics-agent/frontend/`. Only if porting is annoying. Loses the shared look + nav.)*

### What was built
Four sections on `src/pages/demo.astro`, all on `BaseLayout` so header/footer/tokens are shared: a hero with a back-link to `/#projects`, **How it works**, the **example gallery**, and **Ask your own**.

- **`src/data/examples.json`** — generated, not copied. `npm run examples` (`scripts/import-examples.mjs`) reads `../analytics-agent/frontend/examples.json` and rewrites the charts (below). Same shape otherwise: `[{ id, question, answer, sql: string[], chart }]`. Imported by the page, so the gallery is bundled at build time and makes zero requests.
- **Charts are inline SVG, not iframes.** The plan said `<iframe sandbox>` with the agent's `data:text/html` URI. That URI is a Plotly page that pulls ~4 MB from `cdn.plot.ly` at view time and paints on a **white** ground — it breaks the offline promise and punches white holes in a dark page. Instead:
  - `src/lib/plotly-figure.mjs` pulls the traces + layout out of that HTML (`extractFigure`).
  - `src/lib/chart-svg.mjs` draws them (`chartHTML`) — hairline grid, one accent series, endpoint label, crosshair tooltip, and a "Show the numbers" table view.
  - **Bar charts pick their own orientation.** Named categories, or more than 8 of them, flip the chart to horizontal so each label gets a line to itself — a "top 50 buildings" answer was an unreadable smear of overlapping names as upright bars. Horizontal charts cap at `MAX_BARS` (20) rows and say so under the plot; the table view still holds every row. Upright charts tilt long labels and thin the ticks by how much room a label actually needs. Numeric categories (years) always stay upright.
  - Both run at build time for the gallery **and** in the browser for live answers, so the two look identical. If `extractFigure` ever fails on a future chart it returns `null` and the answer renders without one.
- **The gallery is a tablist, not a stack.** Eight fully-expanded answers was ~8 screens nobody reads. Questions are a list (`role="tab"`, arrow-key navigable); one answer shows at a time. With JS off every panel is simply visible — an inline bootstrap collapses them during parse, so there's no flash.
- **Ask your own has two build-time states.** `PUBLIC_AGENT_API_URL` decides which ships. Unset → an explanatory panel, no input (a form that accepts a question and then refuses it is worse than no form). Set → input + suggestion chips + thread. Both are in `AskPanel.astro`; there is no runtime branch and no dead JS.
- **Live answers show the trace.** `steps[].tool` renders as `describe_schema → run_sql → run_sql → make_chart`, which makes the retry loop visible. The gallery can't do this yet — the agent's `examples.json` carries `sql` and `chart` but not `steps`.
- **`POST ${API_BASE}/ask`** with `{ question }` — all four response shapes are handled (`answer`/`steps`/`usage`, `disabled`, `429 limited`, `error`), plus a 2-minute `AbortController` timeout and a network-failure message. See `src/scripts/demo.ts`.
- **Cross-page wiring:** `SiteHeader.astro` nav hrefs are now root-relative (`/#projects`, not `#projects` — a bare fragment scrolls nowhere from `/demo`) and there's a `Demo` link with `aria-current`. `ProjectCard.astro` no longer forces `target="_blank"` on every link (it would have opened `/demo` in a new tab), the whole-card link follows the demo when there is one, and the empty thumbnail placeholder is gone — two identical grey panels read as a broken site.

### How it shows up in Vercel
- **No new Vercel project.** The existing `portfolio` project builds `main` and auto-deploys. `/demo` is just one more statically pre-rendered route → `https://portfolio-liart-rho-94.vercel.app/demo` (and any future custom domain). Build stays static — no adapter, no serverless functions, no config change.
- **Env var:** Vercel → project `portfolio` → Settings → Environment Variables → add `PUBLIC_AGENT_API_URL` for **Production** (and **Preview** if you want live calls on PR deploys). Value = the Cloud Run URL once it exists, e.g. `https://analytics-agent-xxxxx-uw.a.run.app`. `PUBLIC_`-prefixed = Vite inlines it into client JS at **build time**, so after changing it you must **redeploy** (Deployments → ⋯ → Redeploy), not just save. Not a secret — the URL is public and protected by CORS + rate limits + Turnstile on the backend.
- **Preview deploys** get their own origin (`https://portfolio-git-<branch>-<scope>.vercel.app`). The backend allows exactly one origin (below), so live calls fail there with a CORS error — the offline gallery still works. Fine for review; don't rely on "ask your own" on previews.
- **Cost:** Vercel side stays $0 (static). All demo spend is Cloud Run + Claude API, capped by the agent's own controls.

### The CORS coupling — one origin
The backend sets `Access-Control-Allow-Origin` to the single value of its `CORS_ALLOWED_ORIGIN` env var. So when the agent is deployed:
- Set `CORS_ALLOWED_ORIGIN` on Cloud Run to this site's **production** origin: `https://portfolio-liart-rho-94.vercel.app` (or the custom domain when there is one — **if the domain changes, update this on Cloud Run and redeploy the service**).
- `localhost:4321` dev and preview deploys are not that origin → no live answers there unless you temporarily point `CORS_ALLOWED_ORIGIN` at localhost in the agent's `.env` while developing, or teach the backend an allowlist (a backend change — not planned).

### Sequencing
1. ~~**Now:** build `/demo` with the bundled gallery working and `PUBLIC_AGENT_API_URL` unset.~~ **Done 2026-09-08.** `projects.ts` has `demoUrl: "/demo"` and `status: "building"`.
2. ~~**When the agent is deployed:** set `CORS_ALLOWED_ORIGIN` on Cloud Run, `PUBLIC_AGENT_API_URL` in Vercel, redeploy, flip the card to `status: "live"`.~~ **Done 2026-09-08.** All four are in place. The CORS coupling below still binds: change the site's domain and the Cloud Run env var has to change with it.
3. **Keeping `examples.json` fresh:** it's generated in the agent repo (run the agent once in `DEPLOY_MODE=deployed`). Whenever it's regenerated — annual data refresh, or new example questions — re-import it here with `npm run examples` (not `cp`: the script re-extracts the charts) and commit the result.

---

## THE MAIN PAGE — `src/pages/index.astro`

One page, three sections, thin header + footer. Positioning: *clear, organized, communicates well* — typographic and spacious, not a splashy "creative dev" site.

### Header
Name (→ `#top`) · anchor links: Projects, About · Résumé (PDF, new tab). Mobile: name + Résumé only, no hamburger.

### 1. Hero
- **Name:** Carlos Rubio-Marroquin
- **Tagline:** 1–2 lines, adapted from his resume summary. Starter: *"Data science student turning analysis into decisions — Python, SQL, and a bias for communicating clearly."* → **finalize wording with Carlos.**
- **Actions:** "View projects" (anchor) · "Résumé" (PDF) · icon links: GitHub, LinkedIn, email (mailto).
- Optional one-liner: *"B.S. Informatics (Data Science) @ UW · Class of 2027"*. A "seeking [X] internship" line is **Carlos's call.**
- No hero image. One accent color, otherwise neutral.

### 2. Projects  *(the part recruiters read — make it the strongest)*
- Short section intro (one sentence).
- `ProjectCard` per entry in `src/data/projects.ts`. Card shows: title, 1–2 sentence blurb, stack chips, status badge, links (GitHub always; "Live demo" only if `demoUrl` set; "Write-up" later). Whole card links to the repo; inner links for demo/write-up.
- Grid: 2-up ≥768px, stacked below.
- **v1 entries** (details in the `projects.ts` starter below): Agentic Data-Analyst (`status: building`), Containerized Flask + CI/CD (`status: planned`).
- FCP Insight dashboards: **only if Carlos can show something non-confidential** — otherwise mention in About as experience, no card.

### 3. About
- 2–3 sentence bio: analytics for decisions, mission-driven tech, ML + data viz, what he's looking for.
- **Skills**, grouped — Languages: Python, SQL, Java, R · Data/ML: pandas, NumPy, scikit-learn, Plotly, Power BI · Web: HTML, CSS, JS, React, Astro · Tools: Git, Docker, MySQL.
- **Education:** UW — B.S. Informatics: Data Science; Minor in Business Administration (Foster); Class of 2027; GPA 3.7; Armon Dadgar & Joshua Kalla Scholarship.
- Plain text, no timeline widget.

### Footer
Social icons · "Built with Astro, deployed on Vercel" · © 2026.

### Style
- **Content width is a token, not a class.** `--page-max` in `global.css` (64rem) drives the `.page-shell` class that header, footer and every section use, so they always line up. A page widens *all* of itself by passing `wide` to `BaseLayout`, which puts `.page-wide` (80rem) on `<body>` — `/demo` does, because tables and charts are starved at 64rem. Don't reintroduce `mx-auto max-w-5xl px-6`; that made the header disagree with the content. Text keeps its own measure (`max-w-2xl`, or `72ch` on `.answer-prose` blocks) regardless of how wide the column gets.
- Mobile-first, single breakpoint ~768px.
- One accent color — **pick with Carlos** (default: a deep blue). Neutral grays elsewhere. System font stack or Inter.
- Dark mode: keep it if the starter includes it; don't build from scratch for v1.
- A11y from the start: semantic landmarks (`header`/`main`/`footer`, `section` + headings), alt text, visible focus, AA contrast.

### SEO / meta (in `BaseHead.astro`)
- `<title>`: "Carlos Rubio-Marroquin — Data Science"
- meta description; Open Graph title/description/type/url; `og:image` deferred.
- `favicon.svg` (initials or a simple mark).

---

## Data file starters

`src/data/profile.ts`
```ts
export const profile = {
  name: "Carlos Rubio-Marroquin",
  tagline: "Data science student turning analysis into decisions.", // DECIDE w/ Carlos
  resumePath: "/resume.pdf",
  links: {
    github: "https://github.com/<handle>",              // TODO
    linkedin: "https://www.linkedin.com/in/<handle>",   // TODO
    email: "carlosarm.200525@gmail.com",                // already on his public resume; swap for a form if he prefers
  },
  education: {
    school: "University of Washington",
    degree: "B.S. Informatics: Data Science",
    minor: "Business Administration (Foster School of Business)",
    grad: "Class of 2027",
    gpa: "3.7",
    honors: ["Armon Dadgar & Joshua Kalla Scholarship"],
  },
};
```

`src/data/projects.ts`
```ts
export type Project = {
  slug: string; title: string; blurb: string; stack: string[];
  repoUrl?: string; demoUrl?: string; writeupUrl?: string;
  status: "live" | "building" | "planned";
};

export const projects: Project[] = [
  {
    slug: "agentic-data-analyst",
    title: "Agentic Data-Analyst",
    blurb:
      "An AI agent that answers natural-language questions about Seattle building-energy data — it explores the schema, writes and runs its own SQL, calls a trained model, and draws charts, self-correcting on errors. Tool-use loop built directly on the Claude API.",
    stack: ["Python", "Claude API", "SQL", "scikit-learn", "Plotly", "Cloud Run"],
    repoUrl: "",   // TODO
    demoUrl: "",   // TODO once the agent's §10 deploy is live
    status: "building",
  },
  {
    slug: "flask-cicd",
    title: "Containerized Flask Service + CI/CD",
    blurb:
      "A small Flask service, Dockerized, with a GitHub Actions pipeline that lints and tests every PR and ships the image on merge to main.",
    stack: ["Flask", "Docker", "GitHub Actions", "pytest"],
    repoUrl: "",   // TODO
    status: "planned",
  },
];
```

---

## Out of scope
blog / project deep-dives (MDX) · building dark mode from scratch · web analytics · custom domain (start on `*.vercel.app`) · contact form · animations · CMS.

## Build steps (first session)
1. `npm create astro@latest` in `portfolio/` — pick the **minimal / basics** starter, TypeScript "Strict". The wizard warns the folder isn't empty; the existing `.claude/`, `Claude outputs/`, `CLAUDE.md` don't conflict — continue.
2. `npx astro add tailwind`.
3. Build `BaseLayout` + `BaseHead`, then the three section components, then compose `index.astro`. Add `src/data/*.ts` from the starters above.
4. Drop a current résumé at `public/resume.pdf` (Carlos exports one from `../` — the `Resume and CV` folder).
5. `npm run build` — confirm a clean static build in `dist/`.
6. Do "Housekeeping", then new GitHub repo → push.
7. Import the repo on vercel.com → framework auto-detected as Astro → deploy → **record the `*.vercel.app` URL in this file.**

## Housekeeping (before first commit)
- `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env*`, `.DS_Store`, `.claude/settings.local.json`, and **`Claude outputs/`** (internal planning — keep it out of the public repo).
- Alternative to gitignoring: move `Claude outputs/` up into `Resume and CV/` so it's outside the site repo entirely — **Carlos's call.**

## Decisions (resolved 2026-09-06)
- **Tagline:** the CLAUDE.md starter, kept as-is, + a seeking line (`profile.seeking`): "Seeking new-grad data & analytics roles for 2027." Wording is Carlos's to tweak in `src/data/profile.ts`.
- **Accent color:** warm rust / terracotta — `--color-accent-*` in `src/styles/global.css`, primary is `#b4491f` (AA on white). Neutrals = Tailwind `stone` (warm grey).
- **GitHub / LinkedIn:** `github.com/CarlosRM25` · `linkedin.com/in/carlos-andres-rubio-marroquin-655b47382`. In `profile.ts`.
- **Résumé:** `Carlos_Marroquin_Resume_DataAnalytics.pdf` (the data/analytics-tailored one) → `public/resume.pdf`. Note: that résumé lists his FCP Insight title as "Software Engineer"; About copy stays title-neutral to avoid contradicting it.
- **FCP Insight:** no project card. Mentioned in About as experience (dashboards / data tooling that inform decisions — nothing confidential).
- **Planning docs:** kept in-repo, **gitignored** (`Claude outputs/` in `.gitignore`). Not moved out.

## Still open / next session
- **Put `steps` in the agent's `examples.json`.** The live panel shows the tool trace (`describe_schema → run_sql → …`); the gallery can't, because the export only carries `sql` and `chart`. Adding `steps` to the export would let all eight examples show the loop too — the best single upgrade left for this page.
- **Card screenshots — all three cards now, not just the agent's.** The 2026-09-08 text-only decision for the two FCP Insight cards was reversed 2026-09-11: Carlos's boss cleared posting screenshots (and later, some code) from both systems. `image` is left unset on both in `projects.ts` (each has a TODO comment with the exact path) rather than pointed at a file that doesn't exist yet — do that only once the actual screenshot lands in `public/projects/`, since a missing image renders as a broken-image icon.
- **`make_chart` row limits are the backend's call.** The frontend caps what it *draws* at 20 rows and points at the table for the rest, but the agent still asks for 50. If a tighter default is wanted, that's `agent/prompts.py` in the agent repo, not here.
- Optional: Prettier + `prettier-plugin-astro` aren't installed yet (formatting convention only).
