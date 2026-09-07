# portfolio

Personal portfolio for Carlos Rubio-Marroquin — Astro static site, deployed on Vercel.

Single main page (`src/pages/index.astro`): hero, projects, about, thin header/footer.
Build notes and the full spec live in [`CLAUDE.md`](./CLAUDE.md).

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output -> dist/
npm run preview    # serve the built site
```

Node ≥ 20 (22.12+ recommended — a transitive dep asks for 22.19+).

## Structure

| Path | What |
| --- | --- |
| `src/pages/index.astro` | the page — composes the three sections |
| `src/layouts/BaseLayout.astro` | html skeleton, `<head>`, header + footer |
| `src/components/` | `BaseHead`, `SiteHeader`, `SiteFooter`, `Hero`, `ProjectList`, `ProjectCard`, `About`, `SocialLinks` |
| `src/data/profile.ts` | name, tagline, links, education, skills |
| `src/data/projects.ts` | project entries (`ProjectCard` reads these) |
| `src/styles/global.css` | Tailwind v4 import + accent-colour tokens |
| `public/` | `resume.pdf`, `favicon.svg` |

## Editing content

- **Text, links, skills, education** — `src/data/profile.ts`.
- **Projects** — add/edit entries in `src/data/projects.ts`. A card links to its repo
  (whole-card link) once `repoUrl` is set; `demoUrl` adds a "Live demo" link,
  `writeupUrl` a "Write-up" link. Empty strings are treated as "not set".
- **Accent colour** — the `--color-accent-*` tokens in `src/styles/global.css`.
- **Résumé** — replace `public/resume.pdf`.

## Deploy

Import the repo on vercel.com — framework auto-detects as Astro, no config needed.
After the first deploy, set the real URL as `site` in `astro.config.mjs` (drives
canonical + Open Graph tags).
