export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  // Optional 2:1 thumbnail shown at the top of the card — a screenshot of the
  // project's output or UI, or an architecture diagram. Put files in
  // public/projects/ and reference them as "/projects/<name>.png". Cards render
  // with no image area until this is set.
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
      "An AI agent that answers natural-language questions about Seattle building-energy data — it explores the schema, writes and runs its own SQL, calls a trained model, and draws charts, self-correcting on errors. Tool-use loop built directly on the Claude API.",
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
    note: "In production at FCP Insight — source is private.",
    // Screenshot pending — save to public/projects/bid-grading-system.png, then
    // uncomment:
    // image: "/projects/bid-grading-system.png",
    status: "live",
  },
  {
    slug: "timecard-visualizer",
    title: "Timecard Visualization Service",
    blurb:
      "A Flask microservice that turns raw timecard exports into interactive charts — sunburst views of where labor hours actually go (realized vs. utilized vs. non-billable) and worked-vs-estimated hours per job phase. Post a batch of timecards, get back an embeddable Plotly chart. Ships through a Jenkins pipeline that tests, builds, and pushes the image to AWS ECR.",
    stack: ["Python", "Flask", "pandas", "Plotly", "Docker", "Jenkins", "AWS ECR"],
    note: "In production at FCP Insight — source is private.",
    // Screenshot pending — save to public/projects/timecard-visualizer.png, then
    // uncomment:
    // image: "/projects/timecard-visualizer.png",
    status: "live",
  },
];
