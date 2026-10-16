/* Nasaq Studio — 3D models that stand in for each project's cover.
   Each project names a model in projects.js (model: "padel"). A model is a builder
   that adds objects to a group and returns an update(time) function.
   Look: cartoon toon shading with ink outlines, to match the site. */
(function () {
  var INK = 0x1C1612, CREAM = 0xF6EBD2, RED = 0xD63A2B, MUSTARD = 0xF0BE2C, BLUE = 0x5A8CC4;

  function toonRamp(THREE) {
    var data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    var tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }

  // Ink outline: the same shape, slightly bigger, drawn from the inside in black.
  function outlined(THREE, geo, color, ramp, thickness) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: color, gradientMap: ramp }));
    var hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    hull.scale.setScalar(1 + (thickness || 0.04));
    g.add(hull, body);
    return g;
  }
  function inkEdges(THREE, geo, opacity) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: INK, transparent: opacity < 1, opacity: opacity || 1 }));
  }

  var MODELS = {};

  /* ---------- MOG: a padel court that morphs into a bowling lane and back, every 5 s ---------- */
  MODELS.padel = function (THREE, root, ramp, colors) {
    var COURT = new THREE.Color(colors && colors.court || '#2F6E8F');
    var WOOD = new THREE.Color(colors && colors.lane || '#C98A4B');
    var BALL2 = new THREE.Color(colors && colors.racket || '#7A4FE0').getHex();
    root.scale.setScalar(0.78);

    // Shared base: one box that stretches from court (6 × 11) to lane (2.6 × 12.4)
    var baseG = new THREE.Group(); root.add(baseG);
    var baseGeo = new THREE.BoxGeometry(6, 0.3, 11);
    baseG.add(new THREE.Mesh(baseGeo, new THREE.MeshToonMaterial({ color: CREAM, gradientMap: ramp })), inkEdges(THREE, baseGeo));
    baseG.position.y = -0.15;
    var surfMat = new THREE.MeshToonMaterial({ color: COURT.clone(), gradientMap: ramp });
    var surf = new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 10), surfMat);
    surf.position.y = 0.03; root.add(surf);

    /* Padel parts */
    var padel = new THREE.Group(); root.add(padel);
    var lineMat = new THREE.MeshBasicMaterial({ color: CREAM });
    function line(w, d, x, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), lineMat);
      m.position.set(x, 0.07, z); padel.add(m);
    }
    line(0.06, 10, -2.47, 0); line(0.06, 10, 2.47, 0);
    line(5, 0.06, 0, -4.97); line(5, 0.06, 0, 4.97);
    line(5, 0.06, 0, -3.47); line(5, 0.06, 0, 3.47);
    line(0.06, 6.94, 0, 0);
    var net = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.45, 0.04), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.55 }));
    net.position.y = 0.3; padel.add(net);
    var tape = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: CREAM }));
    tape.position.y = 0.54; padel.add(tape);
    [-2.65, 2.65].forEach(function (x) {
      var post = outlined(THREE, new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), INK, ramp, 0.0);
      post.position.set(x, 0.3, 0); padel.add(post);
    });
    function glass(w, h, x, z, ry) {
      var geo = new THREE.BoxGeometry(w, h, 0.05);
      var g = new THREE.Group();
      g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xBFE3EE, transparent: true, opacity: 0.22, depthWrite: false })), inkEdges(THREE, geo, 0.9));
      g.position.set(x, h / 2 + 0.06, z); g.rotation.y = ry || 0;
      padel.add(g);
    }
    glass(5, 1.5, 0, -5); glass(5, 1.5, 0, 5);
    glass(2, 1.5, -2.5, -4, Math.PI / 2); glass(2, 1.5, 2.5, -4, Math.PI / 2);
    glass(2, 1.5, -2.5, 4, Math.PI / 2);  glass(2, 1.5, 2.5, 4, Math.PI / 2);
    var fenceGeo = new THREE.PlaneGeometry(6, 1.2, 12, 3);
    [-2.5, 2.5].forEach(function (x) {
      var f = new THREE.LineSegments(new THREE.WireframeGeometry(fenceGeo), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.35 }));
      f.rotation.y = Math.PI / 2; f.position.set(x, 0.66, 0); padel.add(f);
    });
    var pBall = outlined(THREE, new THREE.SphereGeometry(0.22, 24, 16), MUSTARD, ramp, 0.08);
    padel.add(pBall);
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.09; padel.add(shadow);

    /* Bowling parts */
    var bowl = new THREE.Group(); root.add(bowl);
    var gutterMat = new THREE.MeshToonMaterial({ color: 0x3A2F27, gradientMap: ramp });
    [-1.15, 1.15].forEach(function (x) {
      var g = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 11.6), gutterMat);
      g.position.set(x, 0.06, 0); bowl.add(g);
    });
    // Aiming arrows
    var arrowShape = new THREE.Shape(); arrowShape.moveTo(0, 0.18); arrowShape.lineTo(0.09, -0.12); arrowShape.lineTo(-0.09, -0.12); arrowShape.closePath();
    var arrowGeo = new THREE.ShapeGeometry(arrowShape);
    for (var i = -3; i <= 3; i++) {
      var a = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: INK }));
      a.rotation.x = -Math.PI / 2; a.position.set(i * 0.26, 0.075, 1.2 + Math.abs(i) * 0.22); bowl.add(a);
    }
    var foul = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: RED }));
    foul.position.set(0, 0.075, 4.6); bowl.add(foul);
    // Pins: lathe profile, white with a red neck stripe
    var prof = [[0, 0], [0.11, 0], [0.16, 0.18], [0.17, 0.32], [0.12, 0.5], [0.07, 0.62], [0.08, 0.72], [0.09, 0.8], [0.06, 0.88], [0, 0.9]]
      .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var pinGeo = new THREE.LatheGeometry(prof, 16);
    var stripeGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16);
    var pins = [];
    [[0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2], [-3, 3], [-1, 3], [1, 3], [3, 3]].forEach(function (p) {
      var pin = new THREE.Group();
      pin.add(outlined(THREE, pinGeo, CREAM, ramp, 0.07));
      var stripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: RED }));
      stripe.position.y = 0.66; pin.add(stripe);
      pin.position.set(p[0] * 0.19, 0.07, -4.3 - p[1] * 0.3);
      pin.userData = { x: pin.position.x, z: pin.position.z, dir: (Math.random() - 0.5) * 2 };
      pin.scale.setScalar(1.3);
      bowl.add(pin); pins.push(pin);
    });
    var bBall = outlined(THREE, new THREE.SphereGeometry(0.3, 28, 18), BALL2, ramp, 0.06);
    [[0.1, 0.12], [-0.1, 0.12], [0, -0.05]].forEach(function (h) {
      var hole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: INK }));
      hole.position.set(h[0], h[1], 0.301); bBall.add(hole);
    });
    bowl.add(bBall);

    var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

    return function update(t) {
      var local = t % 10;
      // 0 = padel court, 1 = bowling lane
      var m = local < 5 ? ease((local - 4.2) / 0.8) : 1 - ease((local - 9.2) / 0.8);

      baseG.scale.set(1 + (2.6 / 6 - 1) * m, 1, 1 + (12.4 / 11 - 1) * m);
      surf.scale.set(1 + (2.0 / 5 - 1) * m, 1, 1 + (11.6 / 10 - 1) * m);
      surfMat.color.copy(COURT).lerp(WOOD, m);

      // Padel parts sink first, bowling parts pop up after
      var pIn = ease(1 - m * 2), bIn = ease(m * 2 - 1);
      padel.scale.set(1, Math.max(0.0001, pIn), 1); padel.visible = pIn > 0.001;
      bowl.scale.set(1, Math.max(0.0001, bIn), 1); bowl.visible = bIn > 0.001;
      pins.forEach(function (pin, i) { var s = ease(m * 2 - 1 - i * 0.03); pin.scale.setScalar(1.3 * Math.max(0.0001, s)); });

      // Padel rally
      var cycle = (t * 0.45) % 2, dir = cycle < 1 ? 1 : -1, k = cycle % 1;
      var z = dir * (-3.6 + k * 7.2);
      var hop = k < 0.5 ? k / 0.5 : (k - 0.5) / 0.5;
      var y = 0.3 + Math.sin(hop * Math.PI) * (k < 0.5 ? 1.7 : 1.1);
      pBall.position.set(Math.sin(t * 0.7) * 1.2, y, z);
      pBall.rotation.x += 0.08 * dir;
      shadow.position.set(pBall.position.x, 0.09, z);
      var sc = 1 - Math.min(0.6, (y - 0.3) / 3);
      shadow.scale.setScalar(sc); shadow.material.opacity = 0.32 * sc;

      // Bowling: roll, strike, pins fall
      var r = (local - 5.4) / 1.6;                 // 0 → 1 while rolling
      var roll = Math.max(0, Math.min(1, r));
      bBall.position.set(Math.sin(roll * Math.PI) * 0.25, 0.37, 4.2 - roll * 8.3);
      bBall.rotation.x = -roll * 14;
      var hit = Math.max(0, Math.min(1, (local - 6.9) / 0.5));
      pins.forEach(function (pin) {
        var d = pin.userData, f = ease(hit);
        pin.rotation.set(-f * 1.45, 0, d.dir * f * 0.9);
        pin.position.set(d.x + d.dir * f * 0.35, 0.07, d.z - f * 0.45);
      });
    };
  };

  /* ---------- Mount a model into an element ---------- */
  window.mount3D = function (el, project, opts) {
    var THREE = window.THREE;
    if (!THREE || !MODELS[project.model]) return false;
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;

    opts = opts || {};
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 8.5, 13.5);
    camera.lookAt(0, 0.6, 0);
    scene.add(new THREE.HemisphereLight(0xFFF4DC, 0x6E5E4E, 0.75));
    var sun = new THREE.DirectionalLight(0xFFFFFF, 0.8); sun.position.set(4, 10, 6); scene.add(sun);

    var spin = new THREE.Group(); scene.add(spin);
    var root = new THREE.Group(); spin.add(root);
    var update = MODELS[project.model](THREE, root, toonRamp(THREE), project.coverStyle);

    // Interaction: hover tilts, horizontal drag spins
    var target = { x: 0, y: 0 }, drag = { on: false, x: 0, moved: 0, extra: 0 };
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5);
      target.y = ((e.clientY - r.top) / r.height - 0.5);
      if (drag.on) { var dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx); drag.extra += dx * 0.01; }
    });
    el.addEventListener('pointerleave', function () { target.x = target.y = 0; drag.on = false; });
    el.addEventListener('pointerdown', function (e) { drag.on = true; drag.x = e.clientX; drag.moved = 0; });
    window.addEventListener('pointerup', function () { drag.on = false; });
    // A drag should not count as a click on the card link
    el.addEventListener('click', function (e) { if (drag.moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

    function size() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull back on tall/narrow boxes so the whole court fits
      camera.position.z = w / h < 1.2 ? 17 : 13.5;
      camera.position.y = w / h < 1.2 ? 10.5 : 8.5;
      camera.lookAt(0, 0.6, 0);
      camera.updateProjectionMatrix();
    }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(el); else window.addEventListener('resize', size);

    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true, t0 = performance.now(), rx = 0, ry = 0;
    function frame(now) {
      var t = (now - t0) / 1000;
      if (!still) update(t);
      rx += (target.y * 0.25 - rx) * 0.06;
      ry += (target.x * 0.6 - ry) * 0.06;
      spin.rotation.x = rx;
      spin.rotation.y = ry + drag.extra + (still ? -0.5 : t * 0.12);
      renderer.render(scene, camera);
      if (visible && !still) requestAnimationFrame(frame);
    }
    if (still) { update(1.2); frame(t0 + 1200); return true; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var was = visible; visible = entries[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(frame);
      }).observe(el);
    }
    requestAnimationFrame(frame);
    el.classList.add('has-3d');
    return true;
  };
})();
