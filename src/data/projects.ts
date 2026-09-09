export type Project = {
  slug: string;
  title: string;
  blurb: string;
  stack: string[];
  // Optional 2:1 thumbnail shown at the top of the card, e.g. a screenshot of
  // the agent's output or an architecture diagram. Put files in
  // public/projects/ and reference them as "/projects/<name>.png".
  // Cards render a neutral placeholder panel until this is set.
  image?: string;
  repoUrl?: string;
  demoUrl?: string;
  writeupUrl?: string;
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
    // The example gallery on /demo is real and live now; the card's status
    // stays "building" until the Cloud Run deploy turns on "ask your own".
    demoUrl: "/demo",
    status: "building",
  },
  {
    slug: "flask-cicd",
    title: "Containerized Flask Service + CI/CD",
    blurb:
      "A small Flask service, Dockerized, with a GitHub Actions pipeline that lints and tests every PR and ships the image on merge to main.",
    stack: ["Flask", "Docker", "GitHub Actions", "pytest"],
    repoUrl: "", // TODO
    status: "planned",
  },
];
