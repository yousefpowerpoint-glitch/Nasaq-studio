/* Nasaq Studio — the project list.
   To add a project: copy one block, give it a new id, fill it in.
   The home page grid and the project page build themselves from this list. */
window.PROJECTS = [
  {
    id: "master-of-games",
    title: "Master of Games",
    subtitle: "Padel",
    type: "website",               // website | branding | exploration
    tags: ["Full website", "Padel"],
    year: "2026",
    role: ["UI/UX design", "Web development"],   // DRAFT: confirm
    url: "",                       // live site link: pending
    // Placeholder cover until real screenshots arrive
    cover: null,
    coverStyle: { court: "#2F6E8F", line: "#F6EBD2", accent: "#F0BE2C" },
    summary: "A complete website for Master of Games, built around padel.",
    overview: "Draft: the full story of this project will be written from the project notes.",
    challenge: "Draft: what the client needed and what stood in the way.",
    solution: "Draft: what we designed and built, page by page.",
    gallery: []                    // e.g. ["assets/work/mog-home.jpg", ...]
  }
];
