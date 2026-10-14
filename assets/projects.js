/* Nasaq Studio — the project list.
   To add a project: copy one block, give it a new id, fill it in.
   Text fields take { en: "...", ar: "..." }.
   The home page grid and the project page build themselves from this list. */
window.PROJECTS = [
  {
    id: "mog",
    title: "MOG",
    subtitle: { en: "Master of Games · Padel", ar: "ماستر أوف جيمز · بادل" },
    type: "website",               // website | branding | exploration
    tags: { en: ["Full website", "Padel"], ar: ["موقع متكامل", "بادل"] },
    year: "2026",
    role: { en: ["Design", "Development"], ar: ["التصميم", "التطوير"] },
    url: "https://mog-courts.vercel.app/",
    logo: null,                    // e.g. "assets/work/mog-logo.svg"
    cover: null,                   // e.g. "assets/work/mog-cover.jpg"
    coverStyle: { court: "#2F6E8F", line: "#F6EBD2", accent: "#F0BE2C" },
    summary: {
      en: "A complete website for MOG, Master of Games padel courts.",
      ar: "موقع متكامل لملاعب البادل MOG، ماستر أوف جيمز."
    },
    overview: { en: "Draft: the full story of this project will be written from the project notes.", ar: "Draft: قصة المشروع كاملة ستُكتب من ملاحظات المشروع." },
    challenge: { en: "Draft: what the client needed and what stood in the way.", ar: "Draft: ما الذي احتاجه العميل، وما الذي كان يعيقه." },
    solution: { en: "Draft: what we designed and built, page by page.", ar: "Draft: ما صمّمناه وبنيناه، صفحة بصفحة." },
    gallery: []                    // e.g. ["assets/work/mog-home.jpg", ...]
  }
];
