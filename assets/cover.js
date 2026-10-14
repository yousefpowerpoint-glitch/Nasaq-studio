/* Placeholder cover drawn in SVG until a project has real screenshots.
   If the project has a logo, it sits on the court instead of the title badge. */
window.coverHTML = function (p) {
  var title = window.tr(p.title);
  if (p.cover) return '<img src="' + p.cover + '" alt="' + title + '" loading="lazy">';
  var c = p.coverStyle || { court: "#2F6E8F", line: "#F6EBD2", accent: "#F0BE2C" };
  var badge = p.logo
    ? '<div class="cover-type cover-logo"><img src="' + p.logo + '" alt="' + title + ' logo"></div>'
    : '<div class="cover-type"><b>' + title + '</b><span>' + (window.tr(p.subtitle) || '') + '</span></div>';
  return (
    '<div class="cover-art" role="img" aria-label="' + title + '">' +
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
      badge +
      '<span class="cover-note">' + window.t('cover.soon', 'Screenshots coming') + '</span>' +
    '</div>'
  );
};
