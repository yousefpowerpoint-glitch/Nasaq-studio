/* Nasaq Studio — page behaviour and motion. One easing ("expo out") everywhere. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var EASE = 'expo.out';

  // Never leave the page covered: if anything below fails, drop the intro after 2.5 s.
  var safety = setTimeout(function () { root.classList.remove('js-intro'); }, 2500);

  /* ---------- Film grain (drawn once, then tiled) ---------- */
  (function grain() {
    var el = document.querySelector('.grain');
    if (!el) return;
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var x = c.getContext('2d'), d = x.createImageData(160, 160);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = Math.random() * 255 | 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 70;
    }
    x.putImageData(d, 0, 0);
    el.style.backgroundImage = 'url(' + c.toDataURL() + ')';
  })();

  /* ---------- Text splitting ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (ch) {
      return '<span class="ch">' + ch + '</span>';
    }).join('');
  });
  document.querySelectorAll('[data-split-words]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="word"><span>' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- Work grid ---------- */
  var grid = document.getElementById('grid');
  var projects = window.PROJECTS || [];
  function cardHTML(p) {
    return '<a class="card" href="project.html#' + p.id + '" data-type="' + p.type + '" data-iris>' +
      '<div class="card-media">' + window.coverHTML(p) + '</div>' +
      '<div class="card-body">' +
        '<span class="card-kicker">' + p.year + ' · ' + (p.type === 'website' ? 'Website' : p.type) + '</span>' +
        '<h3 class="card-title">' + p.title + (p.subtitle ? '<span>' + p.subtitle + '</span>' : '') + '</h3>' +
        '<p class="card-sum">' + p.summary + '</p>' +
        '<ul class="tags">' + p.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        '<span class="card-go" aria-hidden="true">↗</span>' +
      '</div></a>';
  }
  if (grid) {
    grid.innerHTML = projects.map(cardHTML).join('') +
      '<div class="slot" data-type="all"><span><b>Next project</b><br>This space is waiting for yours.</span><a href="#contact">Start a project ↗</a></div>' +
      '<p class="empty" hidden>Nothing here yet. Coming soon.</p>';
    var count = document.querySelector('[data-count="work"]');
    if (count) count.textContent = String(projects.length).padStart(2, '0');

    document.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.dataset.filter;
        document.querySelectorAll('.chip').forEach(function (c) {
          c.classList.toggle('is-on', c === chip);
          c.setAttribute('aria-selected', c === chip);
        });
        var shown = 0;
        grid.querySelectorAll('.card').forEach(function (card) {
          var on = f === 'all' || card.dataset.type === f;
          card.classList.toggle('is-hidden', !on);
          if (on) shown++;
        });
        grid.querySelector('.empty').hidden = shown > 0;
        if (hasGsap && !reduce) {
          gsap.fromTo(grid.querySelectorAll('.card:not(.is-hidden), .slot, .empty:not([hidden])'),
            { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: EASE, stagger: .06, clearProps: 'transform,opacity' });
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- Project page ---------- */
  var pageEl = document.getElementById('project');
  if (pageEl) {
    var id = (location.hash || '').slice(1);
    var p = projects.filter(function (x) { return x.id === id; })[0] || projects[0];
    if (p) {
      document.title = p.title + ' · Nasaq Studio';
      var draft = function (s) { return s.indexOf('Draft:') === 0 ? '<span class="draft">Draft</span> ' + s.slice(6) : s; };
      pageEl.innerHTML =
        '<section class="p-hero"><div class="wrap">' +
          '<a class="p-back" href="index.html#work" data-iris>← All work</a>' +
          '<div class="p-kicker">' + p.tags.join(' · ') + '</div>' +
          '<h1 class="p-title"><span class="line solid" data-split>' + p.title + '</span>' +
            (p.subtitle ? '<span class="line outline" data-split>' + p.subtitle + '</span>' : '') + '</h1>' +
          '<dl class="p-meta">' +
            '<div><dt>Client</dt><dd>' + p.title + '</dd></div>' +
            '<div><dt>Year</dt><dd>' + p.year + '</dd></div>' +
            '<div><dt>Role</dt><dd>' + p.role.join(', ') + '</dd></div>' +
            '<div><dt>Live site</dt><dd>' + (p.url ? '<a href="' + p.url + '" target="_blank" rel="noopener">Visit ↗</a>' : 'Link coming') + '</dd></div>' +
          '</dl>' +
        '</div></section>' +
        '<div class="wrap"><div class="p-cover reveal">' + window.coverHTML(p) + '</div></div>' +
        '<section class="wrap p-text">' +
          '<h2>Overview</h2><p class="reveal">' + draft(p.overview) + '</p>' +
          '<h2>Challenge</h2><p class="reveal">' + draft(p.challenge) + '</p>' +
          '<h2>Solution</h2><p class="reveal">' + draft(p.solution) + '</p>' +
        '</section>' +
        (p.gallery.length ? '<section class="wrap p-gallery">' + p.gallery.map(function (src) {
          return '<img class="reveal" src="' + src + '" alt="' + p.title + ' screenshot" loading="lazy">';
        }).join('') + '</section>' : '') +
        '<section class="p-next wrap">' +
          (p.url ? '<a class="btn btn-red magnetic" href="' + p.url + '" target="_blank" rel="noopener">Visit the live site <span class="arr">↗</span></a>'
                 : '<span class="pill">Live site link coming soon</span>') +
          '<a class="btn btn-ink" href="index.html#contact" data-iris>Start a project like this <span class="arr">↗</span></a>' +
        '</section>';
      pageEl.querySelectorAll('[data-split]').forEach(function (el) {
        el.innerHTML = el.textContent.split(' ').map(function (w) {
          return '<span class="w">' + w.split('').map(function (ch) { return '<span class="ch">' + ch + '</span>'; }).join('') + '</span>';
        }).join(' ');
      });
    }
  }

  /* ---------- Services accordion ---------- */
  document.querySelectorAll('.acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var item = head.parentElement, open = item.classList.contains('is-open');
      document.querySelectorAll('.acc-item').forEach(function (i) {
        i.classList.remove('is-open');
        i.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
      });
      if (!open) { item.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 750);
    });
  });

  /* ---------- Sticky nav state ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Unfinished links ---------- */
  document.querySelectorAll('[data-todo]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
    a.title = 'Link coming soon';
  });

  /* ---------- Without GSAP or with reduced motion: show everything, done ---------- */
  if (!hasGsap || reduce) {
    clearTimeout(safety); root.classList.remove('js-intro');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (href.length < 2 || a.hasAttribute('data-todo')) return;
        var t = document.querySelector(href);
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); }
      });
    });
  }

  /* ---------- Iris ---------- */
  var iris = document.querySelector('.iris');
  var irisState = { r: 0 };
  function setIris() { iris.style.setProperty('--r', irisState.r + 'vmax'); }

  // Open on load
  root.classList.remove('js-intro');
  document.querySelectorAll('.hero, .p-hero').forEach(function (h) { h.classList.add('is-flicker'); });
  iris.style.visibility = 'visible';
  irisState.r = 0; setIris();
  var intro = gsap.timeline({ defaults: { ease: EASE } });
  intro.to(irisState, { r: 150, duration: 1.4, ease: 'power3.inOut', onUpdate: setIris,
    onComplete: function () { iris.style.visibility = 'hidden'; clearTimeout(safety); } }, .25);

  var chars = document.querySelectorAll('.hero-title .ch, .p-title .ch');
  if (chars.length) intro.from(chars, { yPercent: 115, rotate: 6, duration: 1.3, stagger: .045 }, .55);
  if (document.querySelector('.seal')) intro.from('.seal', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)' }, 1.0);
  if (document.querySelector('.nav')) intro.from('.nav-in > *', { y: -24, opacity: 0, duration: 1, stagger: .06, clearProps: 'transform,opacity' }, 1.0);
  var heroReveal = document.querySelectorAll('.hero .reveal, .p-kicker, .p-meta, .p-back');
  if (heroReveal.length) intro.from(heroReveal, { y: 30, opacity: 0, duration: 1.1, stagger: .1, clearProps: 'transform,opacity' }, 1.15);

  // Close, then leave (links marked data-iris)
  document.querySelectorAll('[data-iris]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var href = a.getAttribute('href');
      iris.style.setProperty('--x', e.clientX ? e.clientX + 'px' : '50%');
      iris.style.setProperty('--y', e.clientY ? e.clientY + 'px' : '50%');
      iris.style.visibility = 'visible';
      irisState.r = 150; setIris();
      gsap.to(irisState, { r: 0, duration: .8, ease: 'power3.in', onUpdate: setIris,
        onComplete: function () { location.href = href; } });
    });
  });
  // Coming back with the browser's back button: make sure the page is visible
  window.addEventListener('pageshow', function (e) { if (e.persisted) { irisState.r = 150; setIris(); iris.style.visibility = 'hidden'; } });

  /* ---------- Scroll reveals ---------- */
  gsap.utils.toArray('.sec-title, .cta-title').forEach(function (t) {
    gsap.from(t.querySelectorAll('.word > span'), {
      yPercent: 110, duration: 1.2, ease: EASE, stagger: .07,
      scrollTrigger: { trigger: t, start: 'top 85%' }
    });
  });
  gsap.utils.toArray('.card, .slot, .acc-item, .row, .filters, .cta-ar, .contact .btn, .socials-row, .contact .status, main .reveal:not(.hero .reveal)').forEach(function (el) {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: EASE, clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.utils.toArray('.ghost').forEach(function (g) {
    gsap.fromTo(g, { xPercent: 8 }, { xPercent: -8, ease: 'none',
      scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  if (document.querySelector('.hero-title')) {
    gsap.to('.hero-title', { yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Desktop-only: follower + magnetic ---------- */
  if (!fine) return;

  var follower = document.querySelector('.follower');
  if (follower) {
    var label = follower.querySelector('span');
    var fx = gsap.quickTo(follower, 'x', { duration: .6, ease: 'power3' });
    var fy = gsap.quickTo(follower, 'y', { duration: .6, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { fx(e.clientX); fy(e.clientY); });
    document.querySelectorAll('[data-follow]').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        label.textContent = row.dataset.follow;
        gsap.to(follower, { opacity: 1, scale: 1, rotate: gsap.utils.random(-8, 8), duration: .5, ease: EASE });
      });
      row.addEventListener('mouseleave', function () {
        gsap.to(follower, { opacity: 0, scale: .6, duration: .4, ease: EASE });
      });
    });
  }

  document.querySelectorAll('.magnetic').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .35, y: (e.clientY - r.top - r.height / 2) * .35, duration: .6, ease: EASE });
    });
    btn.addEventListener('mouseleave', function () {
      gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' });
    });
  });
})();
