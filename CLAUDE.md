# Portfolio Site — build notes for Claude Code

Personal portfolio for Carlos Rubio-Marroquin. **Astro** static site, deployed on **Vercel**.
Scoped in the architecture chat; built in focused sessions (this file covers **the main page**; the `/demo` agent page is a later, separate session).

## Status
**v1 shipped** (2026-09-06). Astro 7.3 + Tailwind v4 (`@tailwindcss/vite`, CSS-first config in `src/styles/global.css`), static output. All components + `src/data/*.ts` in place per the spec below; `npm run build` is clean. Résumé PDF, GitHub + LinkedIn URLs wired in with Carlos's real values.

- **Repo:** https://github.com/CarlosRM25/portfolio (`main`)
- **Live:** https://portfolio-liart-rho-94.vercel.app — Vercel Hobby, auto-deploys on push to `main`. Random suffix because `portfolio` was taken; fine for v1 (custom domain is out of scope). Set as `site` in `astro.config.mjs`.

**Next / optional:** fill in `repoUrl`/`demoUrl` on the project cards as those repos go live; Prettier + `prettier-plugin-astro` not installed yet; `/demo` page is a later session.

Dev: `npm run dev` → http://localhost:4321. Node note: a transitive dep (`undici`) wants Node ≥ 22.19; local is 22.14 — warning only, build unaffected. Vercel uses its own Node.

## Stack & conventions
- **Astro** (latest), **static output** — no SSR adapter for v1. The future `/demo` page fetches an external API client-side, so the site stays fully static.
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
    data/profile.ts  data/projects.ts
    styles/global.css
  public/
    resume.pdf                # Carlos exports a current one here
    favicon.svg
  astro.config.mjs  tsconfig.json  package.json
  CLAUDE.md                   # this file
```
`.claude/` and `Claude outputs/` already exist in this folder — see "Housekeeping".

## Related
- `Claude outputs/analytics-agent-architecture.md` — the AI-agent project that gets a `/demo` page here later. Its **§10** defines how this frontend talks to the agent's Cloud Run backend (offline gallery first, live agent on click). **Out of scope for the main-page scaffold.**

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

## Out of scope for the main-page scaffold
`/demo` agent page · blog / project deep-dives (MDX) · building dark mode from scratch · web analytics · custom domain (start on `*.vercel.app`) · contact form · animations · CMS.

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
- `git init` + initial commit done locally — **create the GitHub repo and push** (build step 6).
- **Deploy on Vercel** (build step 7), then set the real URL as `site` in `astro.config.mjs` and record it here.
- Add `repoUrl` / `demoUrl` to `src/data/projects.ts` as those go live (cards wire themselves up).
- Optional: Prettier + `prettier-plugin-astro` aren't installed yet (formatting convention only).
