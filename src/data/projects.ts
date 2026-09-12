export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  // Optional 2:1 thumbnail shown at the top of the card — a screenshot of the
  // project's output or UI, or an architecture diagram. Put files in
  // public/projects/ and reference them as "/projects/<name>.png". Cards render
  // with no image area until this is set — never point this at a file that
  // doesn't exist yet; a missing image renders as a broken-image icon, which
  // reads worse than no image at all.
  //
  // FCP Insight images: cleared by Carlos's boss (2026-09-11) to publish
  // screenshots (and later, some code) from both systems — reversing the
  // 2026-09-08 text-only decision. Images pending; see the TODO on each
  // project below for the exact path to drop in.
  image?: string;
  repoUrl?: string;
  demoUrl?: string;
  writeupUrl?: string;
  // Shown where the links row would be, for work with no public link
  // (proprietary / private repo). Keep it to one short line.
  note?: string;
  status: "live" | "building" | "planned";
};

export const projects: Project[] = [
  {
    slug: "agentic-data-analyst",
    title: "Agentic Data Analyst",
    blurb:
      "Seattle publishes its building-energy filings openly, but “open” still means a raw schema and SQL — not something you can just ask a question. This agent reads that schema, writes and runs its own SQL, and explains what came back in plain English. The core decision: when a query fails, the error goes back to the model as data instead of the app trying to patch it — it reads the actual SQLite error and rewrites its own query. The real surprise while building it: prompt caching was silently not engaging on the deployed model, both cache metrics sitting at zero with no warning; bisecting the prompt by hand to find the real cache floor cut the cost per question from $0.011 to $0.004.",
    stack: ["Python", "Claude API", "SQL", "scikit-learn", "Plotly", "Cloud Run"],
    repoUrl: "https://github.com/CarlosRM25/analytics-AI-Agent-",
    demoUrl: "/demo",
    // Backend is deployed on Cloud Run and "ask your own" answers live.
    status: "live",
  },
  {
    slug: "bid-grading-system",
    title: "Construction Bid Grading System",
    blurb:
      "An automated pipeline that finds and scores public construction bids for a security-systems contractor. It logs into three bid boards, OCRs every spec document, and has an LLM grade each bid against editable business rules, then routes the strongest leads to the right salesperson by territory. A dashboard lets non-engineers tune the rules behind a propose-and-approve workflow.",
    stack: ["Python", "Selenium", "Flask", "Claude API", "EasyOCR", "Docker", "Azure"],
    // TODO(image): drop the screenshot at public/projects/bid-grading-system.png,
    // then add: image: "/projects/bid-grading-system.png",
    note: "In production at FCP Insight. Source is private.",
    status: "live",
  },
  {
    slug: "timecard-visualizer",
    title: "Timecard Visualization Service",
    blurb:
      "A Flask microservice that turns raw timecard exports into interactive charts: sunburst views of where labor hours actually go (realized vs. utilized vs. non-billable), and worked-vs-estimated hours per job phase. Post a batch of timecards, get back an embeddable Plotly chart. Ships through a Jenkins pipeline that tests, builds, and pushes the image to AWS ECR.",
    stack: ["Python", "Flask", "pandas", "Plotly", "Docker", "Jenkins", "AWS ECR"],
    // TODO(image): drop the screenshot at public/projects/timecard-visualizer.png,
    // then add: image: "/projects/timecard-visualizer.png",
    note: "In production at FCP Insight. Source is private.",
    status: "live",
  },
];
