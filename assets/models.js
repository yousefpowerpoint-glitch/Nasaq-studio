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

  /* ---------- MOG: a padel court with a floating racket and a bouncing ball ---------- */
  MODELS.padel = function (THREE, root, ramp, colors) {
    var COURT = new THREE.Color(colors && colors.court || '#2F6E8F').getHex();
    var RACKET = new THREE.Color(colors && colors.racket || '#D63A2B').getHex();
    var court = new THREE.Group();
    root.add(court);

    // Base and playing surface (padel court is 10 × 20 m; scaled to 5 × 10)
    var baseGeo = new THREE.BoxGeometry(6, 0.3, 11);
    var base = new THREE.Mesh(baseGeo, new THREE.MeshToonMaterial({ color: CREAM, gradientMap: ramp }));
    base.position.y = -0.15; court.add(base, inkEdges(THREE, baseGeo)); court.children[1].position.y = -0.15;
    var surfGeo = new THREE.BoxGeometry(5, 0.06, 10);
    var surf = new THREE.Mesh(surfGeo, new THREE.MeshToonMaterial({ color: COURT, gradientMap: ramp }));
    surf.position.y = 0.03; court.add(surf);

    // Court lines
    var lineMat = new THREE.MeshBasicMaterial({ color: CREAM });
    function line(w, d, x, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), lineMat);
      m.position.set(x, 0.07, z); court.add(m);
    }
    line(0.06, 10, -2.47, 0); line(0.06, 10, 2.47, 0);
    line(5, 0.06, 0, -4.97); line(5, 0.06, 0, 4.97);
    line(5, 0.06, 0, -3.47); line(5, 0.06, 0, 3.47);   // service lines (6.95 m from net)
    line(0.06, 6.94, 0, 0);                             // centre service line

    // Net with posts
    var netGeo = new THREE.BoxGeometry(5.2, 0.45, 0.04);
    var net = new THREE.Mesh(netGeo, new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.55 }));
    net.position.y = 0.3; court.add(net);
    var tape = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: CREAM }));
    tape.position.y = 0.54; court.add(tape);
    [-2.65, 2.65].forEach(function (x) {
      var post = outlined(THREE, new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), INK, ramp, 0.0);
      post.position.set(x, 0.3, 0); court.add(post);
    });

    // Glass back walls (the thing that makes padel padel) and side fences
    function glass(w, h, x, z, ry) {
      var geo = new THREE.BoxGeometry(w, h, 0.05);
      var pane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xBFE3EE, transparent: true, opacity: 0.22, depthWrite: false }));
      var edges = inkEdges(THREE, geo, 0.9);
      var g = new THREE.Group(); g.add(pane, edges);
      g.position.set(x, h / 2 + 0.06, z); g.rotation.y = ry || 0;
      court.add(g);
    }
    glass(5, 1.5, 0, -5);  glass(5, 1.5, 0, 5);
    glass(2, 1.5, -2.5, -4, Math.PI / 2); glass(2, 1.5, 2.5, -4, Math.PI / 2);
    glass(2, 1.5, -2.5, 4, Math.PI / 2);  glass(2, 1.5, 2.5, 4, Math.PI / 2);
    // Mesh fence on the sides between the glass
    var fenceGeo = new THREE.PlaneGeometry(6, 1.2, 12, 3);
    [-2.5, 2.5].forEach(function (x) {
      var f = new THREE.LineSegments(new THREE.WireframeGeometry(fenceGeo),
        new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.35 }));
      f.rotation.y = Math.PI / 2; f.position.set(x, 0.66, 0); court.add(f);
    });

    // Racket: solid perforated head + handle
    var racket = new THREE.Group();
    var s = new THREE.Shape();
    s.moveTo(0, -1.25);
    s.bezierCurveTo(0.55, -1.2, 0.95, -0.5, 0.95, 0.2);
    s.bezierCurveTo(0.95, 0.85, 0.5, 1.2, 0, 1.2);
    s.bezierCurveTo(-0.5, 1.2, -0.95, 0.85, -0.95, 0.2);
    s.bezierCurveTo(-0.95, -0.5, -0.55, -1.2, 0, -1.25);
    for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) {
      var hx = -0.55 + c * 0.22 + (r % 2 ? 0.11 : 0), hy = -0.55 + r * 0.25;
      if (hx * hx / 0.5 + (hy - 0.15) * (hy - 0.15) / 0.75 > 1) continue;
      var h = new THREE.Path(); h.absarc(hx, hy, 0.06, 0, Math.PI * 2, false); s.holes.push(h);
    }
    var headGeo = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 18 });
    headGeo.center();
    var head = outlined(THREE, headGeo, RACKET, ramp, 0.035);
    racket.add(head);
    var handle = outlined(THREE, new THREE.CylinderGeometry(0.12, 0.14, 0.9, 16), INK, ramp, 0.06);
    handle.position.y = -1.65; racket.add(handle);
    var grip = outlined(THREE, new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16), MUSTARD, ramp, 0.05);
    grip.position.y = -2.08; racket.add(grip);
    var throat = outlined(THREE, new THREE.BoxGeometry(0.5, 0.3, 0.2), RACKET, ramp, 0.05);
    throat.position.y = -1.25; racket.add(throat);
    racket.scale.setScalar(0.9);
    racket.position.set(1.4, 2.6, 1.2);
    root.add(racket);

    // Ball and its shadow
    var ball = outlined(THREE, new THREE.SphereGeometry(0.22, 24, 16), MUSTARD, ramp, 0.08);
    root.add(ball);
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.09; root.add(shadow);

    return function update(t) {
      // Racket: slow float and swing
      racket.position.y = 2.6 + Math.sin(t * 1.2) * 0.18;
      racket.rotation.set(-0.35 + Math.sin(t * 0.9) * 0.12, t * 0.5, 0.5 + Math.sin(t * 1.1) * 0.1);
      // Ball: rallies across the net, bouncing once on each side
      var cycle = (t * 0.45) % 2, dir = cycle < 1 ? 1 : -1, k = cycle % 1;
      var z = dir * (-3.6 + k * 7.2);
      var hop = k < 0.5 ? k / 0.5 : (k - 0.5) / 0.5;
      var y = 0.3 + Math.sin(hop * Math.PI) * (k < 0.5 ? 1.7 : 1.1);
      ball.position.set(Math.sin(t * 0.7) * 1.2, y, z);
      ball.rotation.x += 0.08 * dir;
      shadow.position.set(ball.position.x, 0.09, z);
      var sc = 1 - Math.min(0.6, (y - 0.3) / 3);
      shadow.scale.setScalar(sc); shadow.material.opacity = 0.32 * sc;
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
    camera.position.set(0, 8, 12.5);
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
      camera.position.z = w / h < 1.2 ? 16 : 12.5;
      camera.position.y = w / h < 1.2 ? 10 : 8;
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
