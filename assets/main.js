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

  /* ---------- Language ---------- */
  var AR = window.LANG === 'ar';
  var t = window.t, tr = window.tr;
  if (AR) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = window.I18N_AR[el.dataset.i18n];
      if (v) el.textContent = v;
    });
    // Lines that show the *other* language switch to English when the page is Arabic
    document.querySelectorAll('[data-alt-lang]').forEach(function (el) { el.lang = 'en'; el.dir = 'ltr'; });
    document.querySelectorAll('[data-follow-key]').forEach(function (el) {
      el.dataset.follow = window.I18N_AR[el.dataset.followKey] || el.dataset.follow;
    });
  }
  var langTab = document.getElementById('lang-tab');
  var leave = null; // set below once the iris exists; closes the iris, then runs a callback
  if (langTab) {
    langTab.textContent = AR ? 'English' : 'عربي';
    langTab.lang = AR ? 'en' : 'ar';
    langTab.setAttribute('aria-label', AR ? 'Switch to English' : 'التبديل إلى العربية');
    langTab.addEventListener('click', function (e) {
      var go = function () {
        try { localStorage.setItem('nasaq-lang', AR ? 'en' : 'ar'); } catch (err) {}
        location.reload();
      };
      if (leave) leave(e, go); else go();
    });
  }
  document.querySelectorAll('[data-todo]').forEach(function (a) { a.title = t('proj.linkSoon', 'Link coming soon'); });

  /* ---------- Text splitting (letters in English; whole words in Arabic so letters stay joined) ---------- */
  function splitInto(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) {
      if (AR) return '<span class="w"><span class="ch">' + w + '</span></span>';
      return '<span class="w">' + w.split('').map(function (ch) { return '<span class="ch">' + ch + '</span>'; }).join('') + '</span>';
    }).join(' ');
  }
  document.querySelectorAll('[data-split]').forEach(splitInto);
  document.querySelectorAll('[data-split-words]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="word"><span>' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- 3D covers ---------- */
  function mountModel(el, proj) {
    if (!el || !proj || !proj.model || !window.mount3D) return;
    var fallback = el.innerHTML;
    el.innerHTML = '';
    if (window.mount3D(el, proj)) {
      el.insertAdjacentHTML('beforeend', '<span class="spin-hint" aria-hidden="true">' + t('spin', '↔ Drag to spin') + '</span>');
    } else {
      el.innerHTML = fallback;
    }
  }

  /* ---------- Site settings: contact, socials, reel ---------- */
  var SITE = window.SITE || {};
  var socialList = document.getElementById('social-links');
  if (socialList) {
    socialList.innerHTML = (SITE.socials || []).map(function (s) {
      return '<li>' + (s.url ? '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.name + '</a>' : '<span>' + s.name + '</span>') + '</li>';
    }).join('');
  }
  document.querySelectorAll('.btn-red[data-todo]').forEach(function (a) {
    if (SITE.contact) { a.href = SITE.contact; a.target = '_blank'; a.rel = 'noopener'; a.removeAttribute('data-todo'); }
  });
  var reel = document.getElementById('reel');
  if (reel) {
    var screen = reel.querySelector('.reel-screen');
    if (SITE.reel) {
      screen.innerHTML = '<video src="' + SITE.reel + '"' + (SITE.reelPoster ? ' poster="' + SITE.reelPoster + '"' : '') +
        ' autoplay muted loop playsinline preload="metadata"></video>';
      reel.classList.add('has-video');
    } else if (!reduce) {
      var n = reel.querySelector('.leader-n'), k = 3;
      setInterval(function () { k = k === 1 ? 3 : k - 1; n.textContent = k; }, 1000);
    }
  }

  /* ---------- Project brief -> WhatsApp ---------- */
  var brief = document.getElementById('brief');
  if (brief) {
    brief.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.getElementById('brief-note');
      var pick = function (name) {
        var el = brief.querySelector('input[name="' + name + '"]:checked');
        return el ? el.parentElement.querySelector('span').textContent : '';
      };
      var name = document.getElementById('brief-name').value.trim();
      var msg = [
        t('brief.hello', "Hi Nasaq Studio, I'd like to start a project."),
        t('brief.lType', 'Type') + ': ' + pick('type'),
        t('brief.lBudget', 'Budget') + ': ' + pick('budget'),
        t('brief.lWhen', 'Timeline') + ': ' + pick('when')
      ];
      if (name) msg.push(t('brief.lName', 'Name') + ': ' + name);
      var num = String(SITE.whatsapp || '').replace(/\D/g, '');
      if (!num) { note.textContent = t('brief.noNumber', 'The WhatsApp number has not been added yet (assets/site.js).'); return; }
      note.textContent = '';
      var a = document.createElement('a');
      a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg.join('\n'));
      a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ---------- Work grid ---------- */
  var grid = document.getElementById('grid');
  var projects = window.PROJECTS || [];
  var TYPE = { website: t('year.website', 'Website'), branding: t('filter.branding', 'Branding'), exploration: t('filter.exploration', 'Exploration') };
  function cardHTML(p) {
    return '<a class="card" href="project.html#' + p.id + '" data-type="' + p.type + '" data-iris>' +
      '<div class="card-media" data-id="' + p.id + '">' + window.coverHTML(p) + '</div>' +
      '<div class="card-body">' +
        '<span class="card-kicker">' + p.year + ' · ' + (TYPE[p.type] || p.type) + '</span>' +
        '<h3 class="card-title">' + tr(p.title) + (p.subtitle ? '<span>' + tr(p.subtitle) + '</span>' : '') + '</h3>' +
        '<p class="card-sum">' + tr(p.summary) + '</p>' +
        '<ul class="tags">' + tr(p.tags).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '</div></a>';
  }
  if (grid) {
    grid.innerHTML = projects.map(cardHTML).join('') +
      '<p class="empty" hidden>' + t('empty', 'Nothing here yet. Coming soon.') + '</p>';
    grid.querySelectorAll('.card-media').forEach(function (m) {
      var proj = projects.filter(function (x) { return x.id === m.dataset.id; })[0];
      mountModel(m, proj);
    });
    // Filters only earn their place once there are enough projects of different kinds
    var kinds = {}; projects.forEach(function (x) { kinds[x.type] = 1; });
    var filters = document.querySelector('.filters');
    if (filters) filters.hidden = !(projects.length >= 4 && Object.keys(kinds).length >= 2);
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
          gsap.fromTo(grid.querySelectorAll('.card:not(.is-hidden), .empty:not([hidden])'),
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
      document.title = tr(p.title) + ' · ' + t('foot.alt', 'Nasaq Studio').replace('NASAQ STUDIO', 'نسق ستوديو');
      var draft = function (s) { return s.indexOf('Draft:') === 0 ? '<span class="draft">' + t('draft', 'Draft') + '</span> ' + s.slice(6) : s; };
      pageEl.innerHTML =
        '<section class="p-hero"><div class="wrap">' +
          '<a class="p-back" href="index.html#work" data-iris>' + t('proj.back', '← All work') + '</a>' +
          '<div class="p-kicker">' + tr(p.tags).join(' · ') + '</div>' +
          (p.logo ? '<img class="p-logo" src="' + p.logo + '" alt="' + tr(p.title) + ' logo">' : '') +
          '<h1 class="p-title"><span class="line solid" data-split>' + tr(p.title) + '</span>' +
            (p.subtitle ? '<span class="line outline sub" data-split>' + tr(p.subtitle) + '</span>' : '') + '</h1>' +
          '<dl class="p-meta">' +
            '<div><dt>' + t('proj.client', 'Client') + '</dt><dd>' + tr(p.title) + '</dd></div>' +
            '<div><dt>' + t('proj.year', 'Year') + '</dt><dd>' + p.year + '</dd></div>' +
            '<div><dt>' + t('proj.role', 'Role') + '</dt><dd>' + tr(p.role).join(AR ? '، ' : ', ') + '</dd></div>' +
            '<div><dt>' + t('proj.live', 'Live site') + '</dt><dd>' + (p.url ? '<a href="' + p.url + '" target="_blank" rel="noopener">' + t('proj.visit', 'Visit ↗') + '</a>' : t('proj.linkSoon', 'Link coming')) + '</dd></div>' +
          '</dl>' +
        '</div></section>' +
        '<div class="wrap"><div class="p-cover reveal">' + window.coverHTML(p) + '</div></div>' +
        (p.url || p.phoneVideo ? '<section class="wrap p-phone">' +
          '<div class="phone reveal"><div class="phone-screen">' +
            '<span class="phone-wait">' + t('phone.loading', 'The live site opens here once published') + '</span>' +
            (p.phoneVideo
              ? '<video src="' + p.phoneVideo + '" autoplay muted loop playsinline></video>'
              : '<iframe src="' + p.url + '" title="' + tr(p.title) + '" loading="lazy" referrerpolicy="no-referrer"></iframe>') +
          '</div></div>' +
          '<div class="p-phone-copy reveal">' +
            '<h2>' + t('phone.title', 'Try it here') + '</h2>' +
            '<p>' + t('phone.text', 'This is the real site, running inside the phone. Scroll and tap around like a customer would.') + '</p>' +
            (p.url ? '<a class="link-u" href="' + p.url + '" target="_blank" rel="noopener">' + t('phone.open', 'Open it in a new tab ↗') + '</a>' : '') +
          '</div></section>' : '') +
        '<section class="wrap p-text">' +
          '<h2>' + t('proj.overview', 'Overview') + '</h2><p class="reveal">' + draft(tr(p.overview)) + '</p>' +
          '<h2>' + t('proj.challenge', 'Challenge') + '</h2><p class="reveal">' + draft(tr(p.challenge)) + '</p>' +
          '<h2>' + t('proj.solution', 'Solution') + '</h2><p class="reveal">' + draft(tr(p.solution)) + '</p>' +
        '</section>' +
        (p.gallery.length ? '<section class="wrap p-gallery">' + p.gallery.map(function (src) {
          return '<img class="reveal" src="' + src + '" alt="' + tr(p.title) + '" loading="lazy">';
        }).join('') + '</section>' : '') +
        '<section class="p-next wrap">' +
          (p.url ? '<a class="btn btn-red magnetic" href="' + p.url + '" target="_blank" rel="noopener">' + t('proj.visitBig', 'Visit the live site') + ' <span class="arr">↗</span></a>'
                 : '<span class="pill">' + t('proj.soonPill', 'Live site link coming soon') + '</span>') +
          '<a class="btn btn-ink" href="index.html#contact" data-iris>' + t('proj.similar', 'Start a project like this') + ' <span class="arr">↗</span></a>' +
        '</section>';
      pageEl.querySelectorAll('[data-split]').forEach(splitInto);
      mountModel(pageEl.querySelector('.p-cover'), p);
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

  /* ---------- Arabic hero: both lines set to the same width ---------- */
  // Same font size for both lines; "نسق" is stretched with kashida until it matches "ستوديو".
  function fitHero() {
    if (!AR) return;
    var solid = document.querySelector('.hero-title .solid'), outline = document.querySelector('.hero-title .outline');
    if (!solid || !outline) return;
    var box = document.querySelector('.hero-in');
    var target = Math.min(box.clientWidth * 0.86, 780);
    var width = function (el) { el.style.display = 'inline-block'; var w = el.getBoundingClientRect().width; el.style.display = ''; return w; };
    outline.style.fontSize = '100px';
    var size = 100 * target / width(outline);
    outline.style.fontSize = solid.style.fontSize = size.toFixed(1) + 'px';
    var goal = width(outline), k = 0;
    for (; k < 20; k++) {
      solid.textContent = 'نس' + 'ـ'.repeat(k) + 'ق';
      if (width(solid) >= goal * 0.98) break;
    }
    splitInto(solid);
  }
  fitHero();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
  window.addEventListener('resize', fitHero);

  /* ---------- Sticky nav state ---------- */
  var nav = document.querySelector('.nav');
  var navIn = document.querySelector('.nav-in'), lastY = window.scrollY, lastGlitch = 0;
  function glitch() {
    if (!navIn || reduce) return;
    navIn.classList.remove('is-glitch'); void navIn.offsetWidth;
    navIn.classList.add('is-glitch');
    setTimeout(function () { navIn.classList.remove('is-glitch'); }, 200);
  }
  function onScroll() {
    var y = window.scrollY, now = Date.now();
    if (nav) {
      var stuck = y > 40;
      if (stuck !== nav.classList.contains('is-stuck')) { nav.classList.toggle('is-stuck', stuck); glitch(); lastGlitch = now; }
      else if (y > lastY + 4 && y > 40 && now - lastGlitch > 1400) { glitch(); lastGlitch = now; }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Unfinished links ---------- */
  document.querySelectorAll('[data-todo]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
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
  leave = function (e, then) {
    iris.style.setProperty('--x', e && e.clientX ? e.clientX + 'px' : '50%');
    iris.style.setProperty('--y', e && e.clientY ? e.clientY + 'px' : '50%');
    iris.style.visibility = 'visible';
    irisState.r = 150; setIris();
    gsap.to(irisState, { r: 0, duration: .8, ease: 'power3.in', onUpdate: setIris, onComplete: then });
  };
  document.querySelectorAll('[data-iris]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var href = a.getAttribute('href');
      leave(e, function () { location.href = href; });
    });
  });
  if (langTab) intro.from(langTab, { xPercent: AR ? -100 : 100, duration: 1, clearProps: 'transform' }, 1.3);
  // Coming back with the browser's back button: make sure the page is visible
  window.addEventListener('pageshow', function (e) { if (e.persisted) { irisState.r = 150; setIris(); iris.style.visibility = 'hidden'; } });

  /* ---------- Scroll reveals ---------- */
  gsap.utils.toArray('.sec-title, .cta-title').forEach(function (t) {
    gsap.from(t.querySelectorAll('.word > span'), {
      yPercent: 110, duration: 1.2, ease: EASE, stagger: .07,
      scrollTrigger: { trigger: t, start: 'top 85%' }
    });
  });
  gsap.utils.toArray('.card, .reel, .acc-item, .row, .cta-alt, .brief fieldset, .brief-name, .contact .btn, .social-links, main .reveal:not(.hero .reveal)').forEach(function (el) {
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

  var cursor = document.createElement('div');
  cursor.className = 'cursor'; cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span></span>';
  document.body.appendChild(cursor);
  root.classList.add('has-cursor');
  var cLabel = cursor.querySelector('span');
  var cx = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
  var cy = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
  window.addEventListener('mousemove', function (e) {
    cx(e.clientX); cy(e.clientY);
    var el = e.target.closest ? e.target : null;
    var state = '', text = '';
    if (el && el.closest('.has-3d')) { state = 'is-label'; text = t('cursor.drag', 'Drag'); }
    else if (el && el.closest('.card')) { state = 'is-label'; text = t('cursor.view', 'View'); }
    else if (el && el.closest('[data-follow]')) { state = 'is-hidden'; }
    else if (el && el.closest('a, button, label, input')) { state = 'is-link'; }
    cursor.className = 'cursor ' + state;
    cLabel.textContent = text;
  });
  document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });

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
