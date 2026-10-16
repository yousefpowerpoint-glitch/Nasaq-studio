/* Nasaq Studio — the project list.
   To add a project: copy one block, give it a new id, fill it in.
   Text fields take { en: "...", ar: "..." }.
   The home page grid and the project page build themselves from this list. */
window.PROJECTS = [
  {
    id: "mog",
    title: "MOG",
    subtitle: { en: "Masters of Games", ar: "ماسترز أوف جيمز" },
    type: "website",               // website | branding | exploration
    tags: { en: ["Booking platform", "Padel · Football · Bowling"], ar: ["منصة حجز", "بادل · كرة قدم · بولينج"] },
    year: "2026",
    role: { en: ["Design", "Development"], ar: ["التصميم", "التطوير"] },
    url: "https://mog-courts.vercel.app/",
    model: "padel",                // 3D cover, built in assets/models.js
    logo: null,                    // e.g. "assets/work/mog-logo.svg"
    cover: null,                   // e.g. "assets/work/mog-cover.jpg"
    coverStyle: { court: "#3D52C9", line: "#F6EBD2", accent: "#F0BE2C", racket: "#7A4FE0" },  // MOG purple-blue
    summary: {
      en: "A court booking platform for MOG at Aden Mall Garden: book padel, football and bowling in seconds.",
      ar: "منصة حجز ملاعب MOG في حديقة عدن مول: احجز ملعبك في ثوانٍ، بادل وكرة قدم وبولينج."
    },
    overview: { en: "Draft: the full story of this project will be written from the project notes.", ar: "Draft: قصة المشروع كاملة ستُكتب من ملاحظات المشروع." },
    challenge: { en: "Draft: what the client needed and what stood in the way.", ar: "Draft: ما الذي احتاجه العميل، وما الذي كان يعيقه." },
    solution: { en: "Draft: what we designed and built, page by page.", ar: "Draft: ما صمّمناه وبنيناه، صفحة بصفحة." },
    gallery: []                    // e.g. ["assets/work/mog-home.jpg", ...]
  }
];
