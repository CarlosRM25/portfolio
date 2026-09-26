export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  // Optional 2:1 thumbnail shown at the top of the card: a screenshot of the
  // project's output or UI. Put files in public/projects/ and reference them
  // as "/projects/<name>.png". Never point this at a file that doesn't exist
  // yet; a missing image renders as a broken-image icon, which reads worse
  // than no image at all.
  //
  // A card can instead get a drawn visual in the same slot, which is what the
  // agent and bid cards use (see VISUALS in ProjectList.astro). Prefer that
  // over a PNG: the card renders at 476px, so a raster gets resampled down,
  // while a component reads the theme tokens and keeps its text as text.
  //
  // FCP Insight screenshots were cleared by Carlos's boss (2026-09-11),
  // reversing the 2026-09-08 text-only decision, so a photo is allowed here
  // if one ever beats the drawn version.
  image?: string;
  repoUrl?: string;
  demoUrl?: string;
  writeupUrl?: string;
  // Shown where the links row would be, for work with no public link
  // (proprietary / private repo). Keep it to one short line.
  note?: string;
  // An outside mention worth linking: press, a write-up, a post by someone who
  // uses the thing. Rendered at note size rather than in the links row, on
  // purpose: social proof should not compete for attention with "see the demo".
  mention?: { label: string; href: string };
  status: "live" | "building" | "planned";
};

export const projects: Project[] = [
  {
    slug: "agentic-data-analyst",
    title: "Agentic Data Analyst",
    // Kept to roughly 60 words on purpose: nobody reads 120 in a grid tile, and
    // the longer version made this card tower over the other two. The decision
    // and the snag now live on /demo, which has the room and which a reader
    // has already chosen to open. Don't grow this back.
    blurb:
      "Seattle publishes its building-energy filings, but open data still means a raw schema and SQL, not something you can ask a question. This agent reads the schema, writes and runs its own SQL, and explains what came back in plain English. When a query fails, the error goes back to the model as data and it rewrites the query itself. Answers cost about $0.004 each, down from $0.011 once I found a prompt-caching bug that reported zeros rather than an error.",
    stack: ["Python", "Claude API", "SQL", "scikit-learn", "Plotly", "Cloud Run"],
    repoUrl: "https://github.com/CarlosRM25/analytics-AI-Agent-",
    demoUrl: "/demo",
    // Backend is deployed on Cloud Run and "ask your own" answers live.
    status: "live",
  },
  {
    slug: "bid-grading-system",
    title: "Construction Bid Grading System",
    // The diagram above this card now carries the mechanics (watch, read,
    // grade, route, plus the dashboard loop), so the words are spent on the
    // decisions instead of repeating the pipeline in prose.
    //
    // The old version claimed it "OCRs every spec document". Per Carlos
    // (2026-09-19) that is backwards: the boards served PDFs with embedded
    // text until one critical board switched to scans, and OCR went in as a
    // fallback for that case. Don't reintroduce the old phrasing.
    blurb:
      "The three bid boards are old enough that none has an API, so the pipeline logs in and reads them the way a person would. Grading rules live in the dashboard rather than in code, because a rule the sales team needs an engineer to change is a rule that goes stale. Edits run through propose and approve, so no one silently reweights everybody's leads. OCR is a later addition, a fallback for the one board that started serving scans with no text layer.",
    stack: ["Python", "Selenium", "Flask", "Claude API", "EasyOCR", "Docker", "Azure"],
    note: "In production at FCP Insight. Source is private.",
    status: "live",
  },
  {
    slug: "timecard-visualizer",
    title: "Timecard Visualization Service",
    // /timecard carries the interactive version and the full description, so
    // the card leads with why the thing is shaped the way it is: the CEO
    // picked the sunburst in conversation, and the brief was to fit an
    // existing system rather than replace it.
    blurb:
      "Turns raw timecard exports into a sunburst of where labor hours actually go. The shape came out of a conversation with the CEO, who uses it: parts of a whole, with any wedge opening into the detail underneath. It returns an embeddable chart rather than its own page, because it had to drop into Electrolytix, the product FCP Insight already ships. It looked right in isolation and wrong once embedded, odd borders and undersized type, which is the kind of thing you only find by shipping.",
    stack: ["Python", "Flask", "pandas", "Plotly", "Docker", "Jenkins", "AWS ECR"],
    // No card visual, unlike the other two. The interactive rebuild moved to
    // its own page (Carlos's call, 2026-09-12: the card version read too
    // small), mirroring the agent's /demo. This card also sits alone in the
    // second grid row, so there is no neighbour for it to look hollow beside.
    // Revisit only if a fourth project lands next to it.
    demoUrl: "/timecard",
    note: "In production at FCP Insight. Source is private.",
    // Carlos supplied this as an lnkd.in shortlink (2026-09-19). Stored as the
    // resolved canonical URL instead: the shortener is a dependency that can
    // break, a bare lnkd.in href tells a reader nothing about where they are
    // going, and the redirect carried utm plus an `rcm=` share token tied to
    // Carlos's own account, which should not be published.
    mention: {
      // Erick Slabaugh is the CEO (confirmed 2026-09-19), which is the same
      // person the blurb credits with picking the sunburst. Naming the role
      // here closes that loop: he chose the shape, then posted about it.
      label: "Featured by our CEO on LinkedIn",
      href: "https://www.linkedin.com/posts/erickslabaugh_before-we-ever-took-electrolytix-to-market-share-7443015970891177985-9EXP/",
    },
    status: "live",
  },
];
