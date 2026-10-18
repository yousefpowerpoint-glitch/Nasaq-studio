/* Brand identity boards, shown under Selected work.
   Put a brand's images in assets/brands/<id>/ and add an entry:
   {
     id: "mog",
     name: { en: "MOG", ar: "موج" },
     year: 2026,
     summary: { en: "...", ar: "..." },
     cover: "assets/brands/mog/cover.jpg",          // the big frame
     images: [ { src: "assets/brands/mog/card.jpg", alt: { en: "Business card", ar: "بطاقة العمل" } } ],
     colors: ["#3D52C9", "#7A4FE0"]
   }
   With no entries the section shows an empty board. */
window.BRANDS = [];
