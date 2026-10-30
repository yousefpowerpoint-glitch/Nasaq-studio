/* Nasaq Studio — offline cache, for slow and patchy connections.
   Pages, scripts and styles: network first, the saved copy if the network is slow or down.
   Images, fonts and libraries: the saved copy at once, refreshed in the background.
   Never touched: the dashboard (/admin, /api) and video (streamed in ranges). */
const VERSION = 'nasaq-v1';
const CORE = [
  '/', '/index.html', '/project.html',
  '/assets/style.css', '/assets/fonts/fonts-ar.css', '/assets/fonts/lalezar-400-arabic.woff2', '/assets/main.js', '/assets/i18n.js', '/assets/site.js', '/assets/projects.js',
  '/assets/brands.js', '/assets/cover.js', '/assets/models.js', '/assets/noon.js', '/assets/icon.svg',
  '/assets/vendor/gsap.min.js', '/assets/vendor/ScrollTrigger.min.js', '/assets/vendor/lenis.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function networkFirst(req, wait) {
  return caches.open(VERSION).then(cache => new Promise(resolve => {
    let done = false;
    const fallback = () => cache.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit && !done && (done = true, resolve(hit)));
    const timer = setTimeout(fallback, wait);  // slow network: show the saved copy meanwhile
    fetch(req).then(res => {
      clearTimeout(timer);
      if (res.ok) cache.put(req, res.clone());
      if (!done) { done = true; resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      cache.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => {
        if (!done) { done = true; resolve(hit || Response.error()); }
      });
    });
  }));
}
function cacheFirst(req) {
  return caches.open(VERSION).then(cache => cache.match(req).then(hit => {
    const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; });
    return hit || fresh;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || /\.mp4$/.test(url.pathname)) return;
    if (req.mode === 'navigate' || /\.(js|css)$/.test(url.pathname) && !url.pathname.includes('/vendor/'))
      return e.respondWith(networkFirst(req, 3500));
    return e.respondWith(cacheFirst(req));
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req));
});
