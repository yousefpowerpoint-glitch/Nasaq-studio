/* Noon — Nasaq Studio's mascot. His head is the Arabic letter ن (a bowl),
   the letter's dot floats above it. Drawn in code so every part can move.
   window.noonSVG({ pose, face, label }) returns an <svg> string.
   pose: wave | point | thumbs | pencil | idle      face: happy | wink | wow | sleep */
(function () {
  var INK = '#1C1612', CREAM = '#F6EBD2', GLOVE = '#FFFBF0', RED = '#D63A2B', MUSTARD = '#F0BE2C';
  var S = 'stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round"';

  // A cartoon glove. Local space: fingers point up (-y), wrist at +y.
  function glove(x, y, angle, kind) {
    var g = '<g transform="translate(' + x + ' ' + y + ') rotate(' + angle + ')">' +
      '<ellipse cx="0" cy="15" rx="11" ry="5.5" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    if (kind === 'point') {
      g += '<rect x="-4.5" y="-34" width="9" height="26" rx="4.5" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    } else if (kind === 'thumb') {
      g += '<rect x="-5" y="-31" width="10" height="22" rx="5" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    } else if (kind === 'grip') {
      // closed hand (holding something)
    } else {
      g += '<circle cx="-9" cy="-11" r="6" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>' +
           '<circle cx="0" cy="-15" r="6.5" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>' +
           '<circle cx="9" cy="-11" r="6" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    }
    g += '<circle cx="0" cy="0" r="13" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    if (kind !== 'point' && kind !== 'thumb') g += '<circle cx="13" cy="3" r="5.5" fill="' + GLOVE + '" ' + S + ' stroke-width="3.5"/>';
    // glove stitching
    g += '<path d="M-5 -3 v8 M2 -4 v9" ' + S + ' stroke-width="2" fill="none" opacity=".55"/></g>';
    return g;
  }

  function pieEye(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')"><g class="noon-eye">' +
      '<ellipse rx="9" ry="13.5" fill="' + INK + '"/>' +
      '<path d="M0 -1 L1.5 -13.4 A9 13.5 0 0 1 8.6 -4.5 Z" fill="' + CREAM + '"/></g></g>';
  }

  function face(kind) {
    var cheeks = '<circle cx="85" cy="168" r="8" fill="' + RED + '" opacity=".45"/>' +
                 '<circle cx="155" cy="168" r="8" fill="' + RED + '" opacity=".45"/>';
    if (kind === 'wink') {
      return cheeks + pieEye(104, 150) +
        '<path d="M127 152 q9 -10 18 0" fill="none" ' + S + ' stroke-width="4.5"/>' +
        '<path d="M100 167 q20 22 40 0 z" fill="' + RED + '" ' + S + ' stroke-width="4"/>';
    }
    if (kind === 'wow') {
      return cheeks +
        '<g transform="translate(104 148)"><g class="noon-eye"><ellipse rx="11" ry="16" fill="' + CREAM + '" ' + S + ' stroke-width="4"/><ellipse cx="2" cy="3" rx="5" ry="7" fill="' + INK + '"/></g></g>' +
        '<g transform="translate(136 148)"><g class="noon-eye"><ellipse rx="11" ry="16" fill="' + CREAM + '" ' + S + ' stroke-width="4"/><ellipse cx="-2" cy="3" rx="5" ry="7" fill="' + INK + '"/></g></g>' +
        '<ellipse cx="120" cy="177" rx="7" ry="8" fill="' + RED + '" ' + S + ' stroke-width="4"/>';
    }
    if (kind === 'sleep') {
      return cheeks +
        '<path d="M95 152 q9 9 18 0 M127 152 q9 9 18 0" fill="none" ' + S + ' stroke-width="4.5"/>' +
        '<path d="M112 175 q8 4 16 0" fill="none" ' + S + ' stroke-width="4"/>';
    }
    return cheeks + pieEye(104, 150) + pieEye(136, 150) +
      '<path d="M101 168 q19 18 38 0" fill="none" ' + S + ' stroke-width="4.5"/>' +
''
  }

  function head(kind) {
    // The letter ن: a thick crescent bowl with rounded tips
    var bowl = 'M34 74 C28 158 74 196 120 196 C166 196 212 158 206 74 ' +
               'C206 64 184 64 184 76 C184 112 156 132 120 132 C84 132 56 112 56 76 C56 64 34 64 34 74 Z';
    return '<g class="noon-head">' +
      '<path d="' + bowl + '" fill="' + CREAM + '" ' + S + ' stroke-width="5"/>' +
      '<path d="M46 96 C50 134 72 166 100 178" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
      face(kind) + '</g>';
  }

  function dot(kind) {
    var z = kind === 'sleep'
      ? '<text x="150" y="40" font-family="Georgia, serif" font-weight="900" font-size="20" fill="' + INK + '">z</text>' +
        '<text x="166" y="22" font-family="Georgia, serif" font-weight="900" font-size="14" fill="' + INK + '">z</text>'
      : '';
    return '<g class="noon-dot-wrap"><g class="noon-dot"><circle cx="120" cy="40" r="17" fill="' + INK + '"/>' +
      '<circle cx="113" cy="33" r="4.5" fill="' + CREAM + '" opacity=".9"/></g></g>' + z;
  }

  function body() {
    return '<path d="M95 186 C87 214 92 236 120 237 C148 236 153 214 145 186 Z" fill="' + CREAM + '" ' + S + ' stroke-width="4.5"/>' +
      '<path d="M91 214 C90 241 100 250 120 250 C140 250 150 241 149 214 Z" fill="' + RED + '" ' + S + ' stroke-width="4.5"/>' +
      '<circle cx="109" cy="226" r="4" fill="' + CREAM + '" ' + S + ' stroke-width="2.5"/>' +
      '<circle cx="131" cy="226" r="4" fill="' + CREAM + '" ' + S + ' stroke-width="2.5"/>';
  }

  function legs() {
    var hose = 'fill="none" ' + S + ' stroke-width="8"';
    return '<path d="M110 246 Q104 268 100 290" ' + hose + '/>' +
      '<path d="M130 246 Q137 268 142 290" ' + hose + '/>' +
      '<ellipse cx="92" cy="297" rx="20" ry="10.5" fill="' + INK + '"/>' +
      '<ellipse cx="150" cy="297" rx="20" ry="10.5" fill="' + INK + '"/>' +
      '<ellipse cx="86" cy="292" rx="7" ry="3" fill="' + CREAM + '" opacity=".5"/>' +
      '<ellipse cx="156" cy="292" rx="7" ry="3" fill="' + CREAM + '" opacity=".5"/>';
  }

  function pencil() {
    return '<g transform="translate(62 252) rotate(-28)">' +
      '<rect x="-5" y="-46" width="10" height="44" fill="' + MUSTARD + '" ' + S + ' stroke-width="3"/>' +
      '<rect x="-5" y="-54" width="10" height="9" rx="2" fill="' + RED + '" ' + S + ' stroke-width="3"/>' +
      '<path d="M-5 -2 L0 12 L5 -2 Z" fill="' + CREAM + '" ' + S + ' stroke-width="3"/>' +
      '<path d="M-1.6 7.5 L0 12 L1.6 7.5 Z" fill="' + INK + '"/></g>';
  }

  function arms(pose) {
    var hose = 'fill="none" ' + S + ' stroke-width="8"';
    // viewer's left arm
    var left;
    if (pose === 'pencil') left = '<path d="M95 200 Q72 222 68 244" ' + hose + '/>' + pencil() + glove(66, 250, 20, 'grip');
    else left = '<path d="M95 200 Q72 222 66 244" ' + hose + '/>' + glove(64, 252, 200);
    // viewer's right arm
    var right;
    if (pose === 'wave') right = '<g class="noon-wave"><path d="M145 200 Q176 186 184 154" ' + hose + '/>' + glove(186, 142, 12) + '</g>';
    else if (pose === 'point') right = '<path d="M145 200 Q178 200 200 186" ' + hose + '/>' + glove(212, 178, 62, 'point');
    else if (pose === 'thumbs') right = '<path d="M145 200 Q172 200 180 176" ' + hose + '/>' + glove(182, 166, 0, 'thumb');
    else right = '<path d="M145 200 Q168 222 174 244" ' + hose + '/>' + glove(176, 252, 160);
    return left + right;
  }

  window.noonSVG = function (o) {
    o = o || {};
    var pose = o.pose || 'wave', kind = o.face || 'happy';
    if (o.headOnly) {
      return '<svg class="noon noon-' + kind + '" viewBox="22 4 196 200" role="img" aria-label="' + (o.label || 'Noon') + '">' +
        head(kind) + dot(kind) + '</svg>';
    }
    return '<svg class="noon noon-' + pose + ' noon-' + kind + '" viewBox="-10 0 260 316" role="img" aria-label="' + (o.label || 'Noon') + '">' +
      '<ellipse cx="121" cy="306" rx="62" ry="7" fill="' + INK + '" opacity=".14"/>' +
      legs() + body() + arms(pose) + head(kind) + dot(kind) + '</svg>';
  };
})();
