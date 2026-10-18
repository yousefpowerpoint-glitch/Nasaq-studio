/* Brand identity boards, shown under Selected work.
   Put a brand's images in assets/brands/<id>/ and add an entry:
   {
     id: "mog",
     name: { en: "MOG", ar: "موج" },
     year: 2026,
     summary: { en: "...", ar: "..." },
     cover: "assets/brands/mog/cover.jpg",          // the big frame
     images: [ { src: "assets/brands/mog/card.jpg", alt: { en: "Business card", ar: "بطاقة العمل" } } ],
     colors: ["#3D52C9", "#7A4FE0"],
     concept: true                                   // a self-initiated concept, not a client job
   }
   With no entries the section shows an empty board. */
window.BRANDS = [
  {
    id: "slice",
    name: { en: "Slice & Craft Co.", ar: "سلايس آند كرافت" },
    year: 2026,
    concept: true,
    summary: {
      en: "A wood-fired pizza place: a neon slice mark, the shopfront, and packaging from the box to the bag.",
      ar: "هوية لمطعم بيتزا على الحطب: شعار نيون على شكل شريحة، واجهة المحل، وتغليف كامل من العلبة للكيس."
    },
    cover: "assets/brands/slice/storefront.webp",
    images: [
      { src: "assets/brands/slice/packaging.webp", alt: { en: "Pizza boxes, bag, slice sleeves and dip cups", ar: "علب البيتزا والكيس وأغلفة الشرائح وعلب الصوص" } }
    ],
    colors: ["#E8452C", "#C9A27A", "#F3E6D3", "#2A2421"]
  },
  {
    id: "pinky",
    name: { en: "Pinky Melt", ar: "بينكي ميلت" },
    year: 2026,
    concept: true,
    summary: {
      en: "An ice-cream shop: a soft, playful mark, an ordering app, cups and packaging, and merch for the team.",
      ar: "هوية لمحل آيس كريم: شعار لطيف ومرِح، تطبيق للطلبات، أكواب وتغليف، ومنتجات للفريق."
    },
    cover: "assets/brands/pinky/packaging.webp",
    images: [
      { src: "assets/brands/pinky/app.webp", alt: { en: "The ordering app", ar: "تطبيق الطلبات" } },
      { src: "assets/brands/pinky/merch.webp", alt: { en: "Aprons, tote bags and pins", ar: "مرايل وأكياس قماش ودبابيس" } }
    ],
    colors: ["#F59BBB", "#F7D35C", "#85D5EA", "#A3335E", "#FFF4EA"]
  }
];
