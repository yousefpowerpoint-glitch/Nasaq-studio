/* Nasaq Studio — the dashboard (/admin).
   Loads the site data from /api/content, edits it in memory, uploads images as they are
   added, and publishes everything in one go with /api/save. */
(function () {
  'use strict';

  var state = {
    data: null,          // { site, projects, brands }
    versions: null,      // file versions the data was read at
    uploads: {},         // path -> blob id, for images added since the last save
    previews: {},        // path -> object URL, so new images show before the site redeploys
    pending: 0,          // uploads in flight
    dirty: false,
    tab: 'brands',
    open: {}             // which panels are expanded, by "brands:id"
  };

  /* ---------- Small helpers ---------- */
  function $(sel, el) { return (el || document).querySelector(sel); }

  // Builds DOM without innerHTML, so typed text can never become markup.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }

  function api(path, body) {
    return fetch('/api/' + path, body === undefined ? { credentials: 'same-origin' } : {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    });
  }

  function slug(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  }
  function uniqueId(base, list) {
    var id = slug(base) || 'item', n = 2, taken = {};
    list.forEach(function (x) { taken[x.id] = 1; });
    while (taken[id]) id = (slug(base) || 'item') + '-' + n++;
    return id;
  }
  // Bilingual fields are { en, ar }; older entries may hold a plain string.
  function bi(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    return { en: v || '', ar: v || '' };
  }
  function imgSrc(path) { return state.previews[path] || '/' + path; }
  function move(list, i, d) {
    var j = i + d;
    if (j < 0 || j >= list.length) return;
    var x = list[i]; list[i] = list[j]; list[j] = x;
  }

  /* ---------- Status and saving ---------- */
  function setStatus(text, kind) {
    var s = $('#status');
    s.textContent = text;
    s.className = 'status' + (kind ? ' is-' + kind : '');
  }
  function changed() {
    state.dirty = true;
    refreshSave();
  }
  function refreshSave() {
    var btn = $('#save');
    btn.disabled = !state.dirty || state.pending > 0;
    if (state.pending > 0) setStatus('جاري رفع ' + state.pending + ' صورة…', 'busy');
    else if (state.dirty) setStatus('عندك تغييرات ما انحفظت.', 'warn');
  }
  window.addEventListener('beforeunload', function (e) {
    if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  function save() {
    if (!state.dirty || state.pending) return;
    var btn = $('#save');
    btn.disabled = true;
    setStatus('جاري الحفظ والنشر…', 'busy');
    var uploads = Object.keys(state.uploads).map(function (p) { return { path: p, blob: state.uploads[p] }; });
    api('save', { data: state.data, versions: state.versions, uploads: uploads }).then(function (r) {
      if (r.ok) {
        state.versions = r.versions || state.versions;
        state.uploads = {};
        state.dirty = false;
        btn.disabled = true;
        setStatus(r.unchanged ? 'ما في شي جديد ينحفظ.' : 'تم الحفظ ✓ الموقع يتحدّث خلال دقيقة تقريبًا.', 'ok');
        return;
      }
      btn.disabled = false;
      if (r._status === 401) return showGate('انتهت الجلسة، ادخل مرة ثانية. تغييراتك باقية في الصفحة.');
      if (r.error === 'stale') return setStatus('الملفات تغيّرت من مكان ثاني بعد ما فتحت اللوحة. انسخ تعديلاتك وحدّث الصفحة.', 'err');
      setStatus('ما انحفظ: ' + (r.detail || r.error || 'خطأ في الاتصال') + '. جرّب مرة ثانية.', 'err');
    }, function () {
      btn.disabled = false;
      setStatus('ما في اتصال. تأكد من النت وجرّب مرة ثانية.', 'err');
    });
  }

  /* ---------- Images: shrink in the browser, then upload ---------- */
  // Big photos become ~1600 px WebP (JPEG where the browser can't make WebP; PNG keeps transparency).
  function shrink(file, maxSide) {
    return createImageBitmap(file).then(function (bmp) {
      var k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      function encode(type, q) {
        return new Promise(function (ok) { c.toBlob(ok, type, q); });
      }
      return encode('image/webp', 0.82).then(function (b) {
        if (b && b.type === 'image/webp') return b;
        return file.type === 'image/png' ? encode('image/png') : encode('image/jpeg', 0.85);
      });
    });
  }
  function toBase64(blob) {
    return new Promise(function (ok, fail) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1]); };
      r.onerror = fail;
      r.readAsDataURL(blob);
    });
  }
  var EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

  // Adds files to a list of paths (folder like "assets/brands/slice"); calls done() after each one.
  function addImages(files, folder, onAdded) {
    Array.prototype.forEach.call(files, function (file) {
      if (!/^image\//.test(file.type)) return;
      state.pending++;
      refreshSave();
      shrink(file, 1800).then(function (blob) {
        var name = slug(file.name.replace(/\.[^.]+$/, '')).slice(0, 30) || 'image';
        var path = folder + '/' + name + '-' + Date.now().toString(36) + '.' + EXT[blob.type];
        return toBase64(blob).then(function (b64) {
          return api('upload', { path: path, base64: b64 });
        }).then(function (r) {
          if (!r.blob) throw new Error(r.detail || r.error || 'upload');
          state.uploads[path] = r.blob;
          state.previews[path] = URL.createObjectURL(blob);
          onAdded(path);
          changed();
        });
      }).catch(function (e) {
        setStatus('ما قدرت أرفع «' + file.name + '»: ' + e.message, 'err');
      }).then(function () {
        state.pending--;
        refreshSave();
        render();
      });
    });
  }

  // A few strong colours from an image, for a brand palette.
  function paletteFrom(path) {
    return new Promise(function (ok) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        var c = document.createElement('canvas'), w = 120, hgt = Math.round(120 * img.height / img.width);
        c.width = w; c.height = hgt;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, hgt);
        var px = ctx.getImageData(0, 0, w, hgt).data, buckets = {};
        for (var i = 0; i < px.length; i += 4) {
          var r = px[i], g = px[i + 1], b = px[i + 2];
          var key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
          var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          var weight = 1 + (mx - mn) / 40; // favour saturated colours over greys
          var bk = buckets[key] || (buckets[key] = { n: 0, r: 0, g: 0, b: 0 });
          bk.n += weight; bk.r += r * weight; bk.g += g * weight; bk.b += b * weight;
        }
        var list = Object.keys(buckets).map(function (k) {
          var x = buckets[k]; return { n: x.n, r: x.r / x.n, g: x.g / x.n, b: x.b / x.n };
        }).sort(function (a, b) { return b.n - a.n; });
        var picked = [];
        list.forEach(function (x) {
          if (picked.length >= 5) return;
          var far = picked.every(function (p) { return Math.abs(p.r - x.r) + Math.abs(p.g - x.g) + Math.abs(p.b - x.b) > 90; });
          if (far) picked.push(x);
        });
        ok(picked.map(function (x) {
          return '#' + [x.r, x.g, x.b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase();
        }));
      };
      img.onerror = function () { ok([]); };
      img.src = imgSrc(path);
    });
  }

  /* ---------- Form pieces ---------- */
  function field(label, input, hint) {
    return h('label', { class: 'field' }, h('span', { text: label }), input, hint ? h('small', { text: hint }) : null);
  }
  function text(obj, key, attrs) {
    return h('input', Object.assign({ type: 'text', value: obj[key] == null ? '' : obj[key],
      oninput: function (e) { obj[key] = e.target.value; changed(); } }, attrs || {}));
  }
  function area(obj, key, rows) {
    return h('textarea', { rows: rows || 3, value: obj[key] || '',
      oninput: function (e) { obj[key] = e.target.value; changed(); } });
  }
  // Arabic and English side by side; writes back into owner[key] as { en, ar }.
  function biField(label, owner, key, multiline) {
    owner[key] = bi(owner[key]);
    var v = owner[key];
    var make = function (lang) {
      return multiline ? area(v, lang) : text(v, lang, lang === 'en' ? { dir: 'ltr' } : {});
    };
    var ar = make('ar'), en = make('en');
    if (multiline) en.setAttribute('dir', 'ltr');
    return h('div', { class: 'bi' },
      field(label + ' (عربي)', ar),
      field(label + ' (English)', en));
  }
  // A bilingual list (tags, roles), typed as comma-separated text.
  function biList(label, owner, key) {
    var v = owner[key] && typeof owner[key] === 'object' && !Array.isArray(owner[key]) ? owner[key] : { en: owner[key] || [], ar: owner[key] || [] };
    owner[key] = v;
    var make = function (lang) {
      return h('input', { type: 'text', dir: lang === 'en' ? 'ltr' : null, value: (v[lang] || []).join(lang === 'en' ? ', ' : '، '),
        oninput: function (e) {
          v[lang] = e.target.value.split(/[,،]/).map(function (s) { return s.trim(); }).filter(Boolean);
          changed();
        } });
    };
    return h('div', { class: 'bi' },
      field(label + ' (عربي)', make('ar'), 'افصل بينها بفاصلة'),
      field(label + ' (English)', make('en'), 'Comma separated'));
  }

  // An ordered set of images. First one can be marked as the main image.
  function gallery(paths, folder, opts) {
    opts = opts || {};
    var grid = h('div', { class: 'thumbs' });
    paths.forEach(function (p, i) {
      grid.appendChild(h('figure', { class: 'thumb' + (i === 0 && opts.mainFirst ? ' is-main' : '') },
        h('img', { src: imgSrc(p), alt: '', loading: 'lazy' }),
        i === 0 && opts.mainFirst ? h('span', { class: 'badge', text: 'الرئيسية' }) : null,
        h('figcaption', null,
          h('button', { type: 'button', title: 'قبل', 'aria-label': 'حرّك للأمام', disabled: i === 0,
            onclick: function () { move(paths, i, -1); changed(); render(); } }, '→'),
          opts.mainFirst && i > 0 ? h('button', { type: 'button', class: 'star', title: 'اجعلها الرئيسية',
            onclick: function () { paths.unshift(paths.splice(i, 1)[0]); changed(); render(); } }, '★ رئيسية') : null,
          h('button', { type: 'button', title: 'بعد', 'aria-label': 'حرّك للخلف', disabled: i === paths.length - 1,
            onclick: function () { move(paths, i, 1); changed(); render(); } }, '←'),
          h('button', { type: 'button', class: 'del', title: 'احذف', 'aria-label': 'احذف الصورة',
            onclick: function () { paths.splice(i, 1); changed(); render(); } }, '✕')
        )));
    });
    if (!opts.max || paths.length < opts.max) {
      var input = h('input', { type: 'file', accept: 'image/*', multiple: opts.max === 1 ? null : true, hidden: true,
        onchange: function (e) {
          addImages(e.target.files, folder, function (path) {
            if (opts.max === 1) paths.splice(0, paths.length);
            paths.push(path);
          });
          e.target.value = '';
        } });
      grid.appendChild(h('label', { class: 'thumb thumb-add' }, input,
        h('span', { text: '+' }), h('small', { text: opts.addLabel || 'أضف صور' })));
    }
    return grid;
  }

  function panel(key, title, sub, body, tools) {
    var open = state.open[key] !== false;
    var d = h('details', { class: 'card', open: open,
      ontoggle: function () { state.open[key] = d.open; } },
      h('summary', null, h('b', { text: title || 'بدون اسم' }), sub ? h('span', { class: 'sub', text: sub }) : null,
        h('span', { class: 'tools', onclick: function (e) { if (e.target.closest('button')) e.preventDefault(); } }, tools)),
      h('div', { class: 'card-body' }, body));
    return d;
  }
  function listTools(list, i, label) {
    return [
      h('button', { type: 'button', title: 'لفوق', disabled: i === 0, onclick: function () { move(list, i, -1); changed(); render(); } }, '↑'),
      h('button', { type: 'button', title: 'لتحت', disabled: i === list.length - 1, onclick: function () { move(list, i, 1); changed(); render(); } }, '↓'),
      h('button', { type: 'button', class: 'del', title: 'احذف',
        onclick: function () {
          if (!confirm('تحذف «' + label + '» من الموقع؟ (يتم الحذف فعليًا بعد ما تضغط احفظ وانشر)')) return;
          list.splice(i, 1); changed(); render();
        } }, 'حذف')
    ];
  }

  /* ---------- Tabs ---------- */
  function brandsTab() {
    var brands = state.data.brands;
    var wrap = h('div', null,
      h('div', { class: 'intro' },
        h('h2', { text: 'الهويات البصرية' }),
        h('p', { text: 'أول صورة هي الكبيرة، الصورتين بعدها تجي جنبها، والباقي صف تحت. رتّبها بالأسهم أو اضغط «★ رئيسية».' })));
    brands.forEach(function (b, i) {
      var name = bi(b.name);
      // The dashboard edits one ordered list; the site gets cover + images from it.
      var imgs = (b.cover ? [b.cover] : []).concat((b.images || []).map(function (x) { return x.src; }));
      var alts = {};
      (b.images || []).forEach(function (x) { alts[x.src] = x.alt; });
      var sync = function () {
        b.cover = imgs[0] || null;
        b.images = imgs.slice(1).map(function (src) { return alts[src] ? { src: src, alt: alts[src] } : { src: src }; });
      };
      var proxy = new Proxy(imgs, { set: function (t, k, v) { t[k] = v; sync(); return true; },
        deleteProperty: function (t, k) { delete t[k]; sync(); return true; } });

      var colors = b.colors || (b.colors = []);
      var swatches = h('div', { class: 'swatches' },
        colors.map(function (c, ci) {
          return h('div', { class: 'swatch' },
            h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(c) ? c : '#000000', 'aria-label': 'اللون',
              oninput: function (e) { colors[ci] = e.target.value.toUpperCase(); e.target.nextSibling.value = colors[ci]; changed(); } }),
            h('input', { type: 'text', dir: 'ltr', value: c, maxlength: 7, 'aria-label': 'كود اللون',
              oninput: function (e) {
                var v = e.target.value.trim();
                if (/^#[0-9a-f]{6}$/i.test(v)) { colors[ci] = v.toUpperCase(); e.target.previousSibling.value = v; changed(); }
              } }),
            h('button', { type: 'button', class: 'del', 'aria-label': 'احذف اللون',
              onclick: function () { colors.splice(ci, 1); changed(); render(); } }, '✕'));
        }),
        h('button', { type: 'button', class: 'chip', onclick: function () { colors.push('#D63A2B'); changed(); render(); } }, '+ لون'),
        imgs.length ? h('button', { type: 'button', class: 'chip',
          onclick: function () {
            paletteFrom(imgs[0]).then(function (list) {
              if (!list.length) return setStatus('ما قدرت أقرأ ألوان الصورة.', 'err');
              b.colors = list; changed(); render();
            });
          } }, 'استخرج من الصورة الرئيسية') : null);

      var body = [
        h('div', { class: 'row' },
          h('div', { class: 'bi' },
            field('الاسم (عربي)', text(name, 'ar', { oninput: function (e) { name.ar = e.target.value; b.name = name; changed(); } })),
            field('الاسم (English)', text(name, 'en', { dir: 'ltr', oninput: function (e) { name.en = e.target.value; b.name = name; changed(); } }))),
          h('div', { class: 'pair' },
            field('السنة', text(b, 'year', { inputmode: 'numeric', dir: 'ltr', oninput: function (e) { b.year = e.target.value; changed(); } })),
            h('label', { class: 'check' },
              h('input', { type: 'checkbox', checked: !!b.concept, onchange: function (e) { b.concept = e.target.checked; changed(); } }),
              h('span', { text: 'مشروع مفاهيمي (مو لعميل حقيقي)' })))),
        biField('الوصف', b, 'summary', true),
        h('h3', { text: 'الصور' }),
        gallery(proxy, 'assets/brands/' + b.id, { mainFirst: true }),
        h('h3', { text: 'الألوان' }),
        swatches
      ];
      wrap.appendChild(panel('brands:' + b.id, name.ar || name.en, b.year, body, listTools(brands, i, name.ar || name.en)));
    });
    wrap.appendChild(h('button', { type: 'button', class: 'btn btn-ink add',
      onclick: function () {
        var en = prompt('اسم الهوية بالإنجليزي (يُستخدم لاسم المجلد):');
        if (!en) return;
        var b = { id: uniqueId(en, brands), name: { en: en, ar: '' }, year: String(new Date().getFullYear()),
          concept: false, summary: { en: '', ar: '' }, cover: null, images: [], colors: [] };
        brands.push(b);
        state.open['brands:' + b.id] = true;
        changed(); render();
      } }, '+ أضف هوية جديدة'));
    return wrap;
  }

  function projectsTab() {
    var projects = state.data.projects;
    var wrap = h('div', null,
      h('div', { class: 'intro' },
        h('h2', { text: 'المشاريع' }),
        h('p', { text: 'تظهر في «أعمال مختارة» ولكل مشروع صفحته الخاصة.' })));
    projects.forEach(function (p, i) {
      var folder = 'assets/work/' + p.id;
      var logo = p.logo ? [p.logo] : [];
      var logoProxy = new Proxy(logo, { set: function (t, k, v) { t[k] = v; p.logo = t[0] || null; return true; },
        deleteProperty: function (t, k) { delete t[k]; p.logo = t[0] || null; return true; } });
      var cover = p.cover ? [p.cover] : [];
      var coverProxy = new Proxy(cover, { set: function (t, k, v) { t[k] = v; p.cover = t[0] || null; return true; },
        deleteProperty: function (t, k) { delete t[k]; p.cover = t[0] || null; return true; } });
      p.gallery = p.gallery || [];

      var body = [
        h('div', { class: 'row' },
          typeof p.title === 'object' ? biField('اسم المشروع', p, 'title') : field('اسم المشروع', text(p, 'title', { dir: 'auto' })),
          h('div', { class: 'pair' },
            field('السنة', text(p, 'year', { inputmode: 'numeric', dir: 'ltr' })),
            field('النوع', h('select', { onchange: function (e) { p.type = e.target.value; changed(); } },
              [['website', 'موقع'], ['branding', 'هوية'], ['exploration', 'تجربة']].map(function (o) {
                return h('option', { value: o[0], selected: p.type === o[0] }, o[1]);
              }))))),
        biField('العنوان الفرعي', p, 'subtitle'),
        field('رابط الموقع', text(p, 'url', { type: 'url', dir: 'ltr', placeholder: 'https://' })),
        biList('الوسوم', p, 'tags'),
        biList('دورنا', p, 'role'),
        biField('الملخص (يظهر في البطاقة)', p, 'summary', true),
        biField('نظرة عامة', p, 'overview', true),
        biField('التحدي', p, 'challenge', true),
        biField('الحل', p, 'solution', true),
        h('h3', { text: 'الغلاف' }),
        p.model ? h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: p.use3d !== false,
            onchange: function (e) { p.use3d = e.target.checked; changed(); } }),
          h('span', { text: 'استخدم المجسّم الثلاثي الأبعاد كغلاف (لو شلت الصح تظهر صورة الغلاف)' })) : null,
        gallery(coverProxy, folder, { max: 1, addLabel: 'صورة الغلاف' }),
        h('h3', { text: 'الشعار' }),
        gallery(logoProxy, folder, { max: 1, addLabel: 'ارفع الشعار' }),
        h('h3', { text: 'معرض الصور (صفحة المشروع)' }),
        gallery(p.gallery, folder)
      ];
      wrap.appendChild(panel('projects:' + p.id, typeof p.title === 'string' ? p.title : bi(p.title).ar, p.year, body,
        listTools(projects, i, typeof p.title === 'string' ? p.title : bi(p.title).ar)));
    });
    wrap.appendChild(h('button', { type: 'button', class: 'btn btn-ink add',
      onclick: function () {
        var en = prompt('اسم المشروع بالإنجليزي (يُستخدم للرابط):');
        if (!en) return;
        var p = { id: uniqueId(en, projects), title: en, subtitle: { en: '', ar: '' }, type: 'website',
          tags: { en: [], ar: [] }, year: String(new Date().getFullYear()), role: { en: [], ar: [] }, url: '',
          logo: null, cover: null, summary: { en: '', ar: '' }, overview: { en: '', ar: '' },
          challenge: { en: '', ar: '' }, solution: { en: '', ar: '' }, gallery: [] };
        projects.push(p);
        state.open['projects:' + p.id] = true;
        changed(); render();
      } }, '+ أضف مشروع جديد'));
    return wrap;
  }

  function settingsTab() {
    var s = state.data.site;
    s.socials = s.socials || [];
    return h('div', null,
      h('div', { class: 'intro' }, h('h2', { text: 'الإعدادات' })),
      h('section', { class: 'card card-flat' },
        field('رقم الواتساب', text(s, 'whatsapp', { dir: 'ltr', inputmode: 'tel',
          oninput: function (e) { s.whatsapp = e.target.value.replace(/\D/g, ''); changed(); } }),
          'أرقام فقط مع رمز الدولة، مثل 967737481653. نموذج الطلب يرسل لهذا الرقم.'),
        h('h3', { text: 'روابط التواصل (أسفل الصفحة)' }),
        h('p', { class: 'hint', text: 'الرابط الفاضي يظهر كاسم بدون رابط.' }),
        s.socials.map(function (so, i) {
          return h('div', { class: 'social' },
            text(so, 'name', { 'aria-label': 'الاسم', dir: 'ltr' }),
            text(so, 'url', { 'aria-label': 'الرابط', dir: 'ltr', type: 'url', placeholder: 'https://' }),
            h('button', { type: 'button', class: 'del', 'aria-label': 'احذف',
              onclick: function () { s.socials.splice(i, 1); changed(); render(); } }, '✕'));
        }),
        h('button', { type: 'button', class: 'chip', onclick: function () { s.socials.push({ name: '', url: '' }); changed(); render(); } }, '+ رابط')));
  }

  function render() {
    if (!state.data) return;
    var panelEl = $('#panel'), y = window.scrollY;
    panelEl.textContent = '';
    panelEl.appendChild(state.tab === 'brands' ? brandsTab() : state.tab === 'projects' ? projectsTab() : settingsTab());
    window.scrollTo(0, y);
  }

  document.querySelectorAll('.tabs [data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.tab = b.dataset.tab;
      document.querySelectorAll('.tabs [data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      render();
      window.scrollTo(0, 0);
    });
  });
  $('#save').addEventListener('click', save);

  /* ---------- Sign in / out ---------- */
  function showGate(msg) {
    $('#app').hidden = !state.data;
    $('#gate').hidden = false;
    $('#login-msg').textContent = msg || '';
    $('#password').focus();
  }
  function load() {
    setStatus('جاري التحميل…', 'busy');
    return api('content').then(function (r) {
      if (r._status === 401) return showGate();
      if (!r.data) return setStatus('ما قدرت أحمّل البيانات: ' + (r.detail || r.error), 'err');
      // Keep edits made before a session expired; otherwise take the fresh copy
      if (!state.dirty) { state.data = r.data; state.versions = r.versions; }
      $('#gate').hidden = true;
      $('#app').hidden = false;
      if (!state.dirty) setStatus('لا توجد تغييرات.');
      refreshSave();
      render();
    });
  }
  $('#login').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button');
    btn.disabled = true;
    $('#login-msg').textContent = '';
    api('login', { password: $('#password').value }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) { $('#login-msg').textContent = r.error === 'password' ? 'كلمة السر غلط.' : 'صار خطأ، جرّب مرة ثانية.'; return; }
      $('#password').value = '';
      load();
    }, function () { btn.disabled = false; $('#login-msg').textContent = 'ما في اتصال.'; });
  });
  $('#logout').addEventListener('click', function () {
    if (state.dirty && !confirm('عندك تغييرات ما انحفظت. تطلع؟')) return;
    api('logout', {}).then(function () { state.dirty = false; location.reload(); });
  });

  api('session').then(function (r) {
    if (r._status !== 200) {
      // The API itself did not answer: the functions are not deployed (or crashed)
      $('#setup').hidden = false;
      $('#setup-why').textContent = 'الخادم ما رد (' + r._status + '). تأكد إن آخر نشر في Vercel نجح (Ready).';
      return;
    }
    if (!r.configured) {
      var why = { GITHUB_TOKEN: 'GITHUB_TOKEN غير موجود.', ADMIN_PASSWORD: 'ADMIN_PASSWORD غير موجود.',
        ADMIN_PASSWORD_SHORT: 'ADMIN_PASSWORD موجود بس أقصر من 10 أحرف.' };
      $('#setup').hidden = false;
      $('#setup-why').textContent = (r.missing || []).map(function (k) { return why[k] || k; }).join(' ') ||
        'الإعدادات ناقصة.';
      return;
    }
    if (!r.loggedIn) return showGate();
    load();
  }, function () { showGate('ما في اتصال بالخادم.'); });
})();
