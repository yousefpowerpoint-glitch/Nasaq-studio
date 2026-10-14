/* Placeholder cover drawn in SVG until a project has real screenshots. */
window.coverHTML = function (p) {
  if (p.cover) return '<img src="' + p.cover + '" alt="' + p.title + '" loading="lazy">';
  var c = p.coverStyle || { court: "#2F6E8F", line: "#F6EBD2", accent: "#F0BE2C" };
  return (
    '<div class="cover-art" role="img" aria-label="' + p.title + ' cover (placeholder)">' +
      '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<rect width="400" height="250" fill="' + c.court + '"/>' +
        '<g fill="none" stroke="' + c.line + '" stroke-width="3" opacity=".9">' +
          '<rect x="60" y="40" width="280" height="170"/>' +
          '<line x1="200" y1="40" x2="200" y2="210"/>' +
          '<line x1="110" y1="40" x2="110" y2="210"/>' +
          '<line x1="290" y1="40" x2="290" y2="210"/>' +
          '<line x1="110" y1="125" x2="290" y2="125"/>' +
        '</g>' +
        '<rect x="196" y="30" width="8" height="190" fill="#1C1612" opacity=".55"/>' +
        '<circle class="ball" cx="250" cy="88" r="11" fill="' + c.accent + '" stroke="#1C1612" stroke-width="3"/>' +
      '</svg>' +
      '<div class="cover-type"><b>' + p.title + '</b><span>' + (p.subtitle || '') + '</span></div>' +
      '<span class="cover-note">Screenshots coming</span>' +
    '</div>'
  );
};
