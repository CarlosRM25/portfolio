export const profile = {
  name: "Carlos Rubio-Marroquin",
  // Adapted from the résumé summary. Finalized with Carlos: starter tagline + a seeking line.
  tagline:
    "Data science student turning analysis into decisions — Python, SQL, and a bias for communicating clearly.",
  // Availability line under the tagline. Set to "" to hide it. Wording is Carlos's to tweak.
  seeking: "Seeking new-grad data & analytics roles for 2027.",
  // One-liner shown beneath the actions in the hero.
  context: "B.S. Informatics (Data Science) @ UW · Class of 2027",
  resumePath: "/resume.pdf",
  links: {
    github: "https://github.com/CarlosRM25",
    linkedin:
      "https://www.linkedin.com/in/carlos-andres-rubio-marroquin-655b47382/",
    email: "carlosarm.200525@gmail.com", // already on his public résumé
  },
  education: {
    school: "University of Washington",
    degree: "B.S. Informatics: Data Science",
    minor: "Business Administration (Foster School of Business)",
    grad: "Class of 2027",
    gpa: "3.7",
    honors: ["Armon Dadgar & Joshua Kalla Scholarship"],
  },
  // Grouped for the About section. Order = display order.
  skills: [
    { group: "Languages", items: ["Python", "SQL", "Java", "R"] },
    {
      group: "Data & ML",
      items: ["pandas", "NumPy", "scikit-learn", "Plotly", "Power BI"],
    },
    { group: "Web", items: ["HTML", "CSS", "JavaScript", "React", "Astro"] },
    { group: "Tools", items: ["Git", "Docker", "MySQL"] },
  ],
} as const;

export type Profile = typeof profile;
