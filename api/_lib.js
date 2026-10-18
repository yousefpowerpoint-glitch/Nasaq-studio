/* Shared code for the admin API (Vercel serverless functions).
   Files in api/ that start with "_" are not routes.

   The dashboard edits three data files in the GitHub repo and uploads images to it.
   Every save is one commit on main; Vercel redeploys the site from it.

   Environment (set in Vercel → Project → Settings → Environment Variables):
     ADMIN_PASSWORD  the dashboard password
     GITHUB_TOKEN    fine-grained token for this repo only, "Contents: Read and write"
     GITHUB_REPO     optional, defaults to yousefpowerpoint-glitch/Nasaq-studio
     GITHUB_BRANCH   optional, defaults to main
   ADMIN_STORE=local makes the API read and write the working copy instead (tools/admin-dev.js). */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = process.env.GITHUB_REPO || 'yousefpowerpoint-glitch/Nasaq-studio';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

/* The editable data files: path, global name, header comment. */
const FILES = {
  site: {
    path: 'assets/site.js', global: 'SITE',
    head: '/* Nasaq Studio — site settings. Edited from the dashboard (/admin); hand edits are fine too. */'
  },
  projects: {
    path: 'assets/projects.js', global: 'PROJECTS',
    head: '/* Nasaq Studio — the project list. Edited from the dashboard (/admin); hand edits are fine too.\n' +
          '   Text fields take { en: "...", ar: "..." }. model names a 3D cover in assets/models.js. */'
  },
  brands: {
    path: 'assets/brands.js', global: 'BRANDS',
    head: '/* Nasaq Studio — brand identity boards, shown under Selected work.\n' +
          '   Edited from the dashboard (/admin); hand edits are fine too. Images live in assets/brands/<id>/. */'
  }
};

/* Uploaded images may only land in these folders, with plain names. */
const UPLOAD_PATH = /^assets\/(brands|work)\/[a-z0-9-]{1,40}\/[a-z0-9-]{1,60}\.(webp|jpg|png)$/;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/* ---------- Session: a signed cookie, no server state ---------- */
const COOKIE = 'nasaq_admin';
const SESSION_DAYS = 14;

function secret() {
  // Derived from both secrets, so changing either one signs everybody out.
  return crypto.createHash('sha256')
    .update('nasaq-admin|' + (process.env.ADMIN_PASSWORD || '') + '|' + (process.env.GITHUB_TOKEN || ''))
    .digest();
}
function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function readCookie(req, name) {
  const all = req.headers.cookie || '';
  const hit = all.split(/;\s*/).find(c => c.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}
function setSession(res) {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  const secure = process.env.ADMIN_STORE === 'local' ? '' : ' Secure;';
  res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`);
}
function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}
function hasSession(req) {
  const [exp, mac] = readCookie(req, COOKIE).split('.');
  return !!exp && !!mac && safeEqual(mac, sign(exp)) && Number(exp) > Date.now();
}
function checkPassword(given) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (real.length < 10) return false; // refuse to run with no password or a short one
  // Compare hashes so the length of the real password does not leak through timing.
  const h = s => crypto.createHash('sha256').update(String(s)).digest('hex');
  return safeEqual(h(given), h(real));
}

/* ---------- Request guards ---------- */
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
/* Writes must come from this site's own pages (the cookie is SameSite=Strict too). */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}
/* Wraps a handler: method check, auth, origin check, error reporting. */
function route(methods, handler, opts) {
  opts = opts || {};
  return async function (req, res) {
    try {
      if (!methods.includes(req.method)) return json(res, 405, { error: 'method' });
      if (req.method !== 'GET' && !sameOrigin(req)) return json(res, 403, { error: 'origin' });
      if (!opts.open && !hasSession(req)) return json(res, 401, { error: 'login' });
      if (!opts.open && !configured()) return json(res, 500, { error: 'config' });
      await handler(req, res);
    } catch (e) {
      console.error(e);
      json(res, e.status || 500, { error: e.code || 'server', detail: e.expose ? e.message : undefined });
    }
  };
}
function configured() {
  return process.env.ADMIN_STORE === 'local' || !!process.env.GITHUB_TOKEN;
}
function fail(status, code, message) {
  const e = new Error(message || code); e.status = status; e.code = code; e.expose = !!message; return e;
}

/* ---------- Data files: JS literal <-> JSON ---------- */
/* The files are plain `window.X = {...}` literals (some hand-written, with comments),
   so they are read by running them in an empty sandbox with only `window` defined. */
function parseData(key, text) {
  const sandbox = { window: {} };
  vm.runInNewContext(text, sandbox, { timeout: 200 });
  const value = sandbox.window[FILES[key].global];
  // Round-trip through JSON so nothing from the sandbox leaks out
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}
function serialize(key, value) {
  return FILES[key].head + '\nwindow.' + FILES[key].global + ' = ' + JSON.stringify(value, null, 2) + ';\n';
}

/* Light shape checks: the dashboard is the only writer, this just stops a broken save. */
function validate(data) {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(data)) throw fail(400, 'shape', 'data');
  if (!isObj(data.site)) throw fail(400, 'shape', 'site');
  if (!Array.isArray(data.projects)) throw fail(400, 'shape', 'projects');
  if (!Array.isArray(data.brands)) throw fail(400, 'shape', 'brands');
  const ids = list => {
    const seen = {};
    list.forEach(x => {
      if (!isObj(x) || !/^[a-z0-9-]{1,40}$/.test(x.id || '')) throw fail(400, 'shape', 'id: ' + (x && x.id));
      if (seen[x.id]) throw fail(400, 'shape', 'duplicate id: ' + x.id);
      seen[x.id] = 1;
    });
  };
  ids(data.projects); ids(data.brands);
  if (JSON.stringify(data).length > 400000) throw fail(400, 'shape', 'too big');
}

/* Every local image path a data set points at. */
function imagePaths(data) {
  const out = new Set();
  (function walk(v) {
    if (typeof v === 'string') { if (UPLOAD_PATH.test(v)) out.add(v); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(v[k]));
  })(data);
  return out;
}

/* The id git gives a file's content, so a save can hand back the new versions without re-reading. */
function gitSha(text) {
  const buf = Buffer.from(text, 'utf8');
  return crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex');
}

/* ---------- Stores: GitHub (production) and the local working copy (dev) ---------- */
async function gh(pathname, init) {
  init = init || {};
  const r = await fetch('https://api.github.com/repos/' + REPO + pathname, {
    method: init.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'nasaq-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: init.body ? JSON.stringify(init.body) : undefined
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('GitHub', r.status, pathname, body.message);
    throw fail(r.status === 401 || r.status === 403 ? 502 : r.status === 422 ? 409 : 502, 'github', 'GitHub ' + r.status + ': ' + (body.message || ''));
  }
  return body;
}

const githubStore = {
  /* Current text and blob sha of each data file, at the head of the branch. */
  async read() {
    const out = {};
    for (const key of Object.keys(FILES)) {
      const f = await gh('/contents/' + FILES[key].path + '?ref=' + encodeURIComponent(BRANCH));
      out[key] = { text: Buffer.from(f.content, 'base64').toString('utf8'), sha: f.sha };
    }
    return out;
  },
  async putBlob(base64) {
    const b = await gh('/git/blobs', { method: 'POST', body: { content: base64, encoding: 'base64' } });
    return b.sha;
  },
  /* One commit: new data files, new images (already uploaded as blobs), removed images. */
  async commit({ files, uploads, deletes, message }) {
    const ref = await gh('/git/ref/heads/' + encodeURIComponent(BRANCH));
    const head = await gh('/git/commits/' + ref.object.sha);
    const tree = [];
    Object.keys(files).forEach(p => tree.push({ path: p, mode: '100644', type: 'blob', content: files[p] }));
    uploads.forEach(u => tree.push({ path: u.path, mode: '100644', type: 'blob', sha: u.blob }));
    deletes.forEach(p => tree.push({ path: p, mode: '100644', type: 'blob', sha: null }));
    const newTree = await gh('/git/trees', { method: 'POST', body: { base_tree: head.tree.sha, tree } });
    const commit = await gh('/git/commits', { method: 'POST', body: { message, tree: newTree.sha, parents: [ref.object.sha] } });
    // Not forced: if main moved since we read it, GitHub refuses and the user retries.
    await gh('/git/refs/heads/' + encodeURIComponent(BRANCH), { method: 'PATCH', body: { sha: commit.sha, force: false } });
    return commit.sha;
  }
};

const ROOT = path.join(__dirname, '..');
const localBlobs = new Map();
const localStore = {
  async read() {
    const out = {};
    for (const key of Object.keys(FILES)) {
      const text = fs.readFileSync(path.join(ROOT, FILES[key].path), 'utf8');
      out[key] = { text, sha: gitSha(text) };
    }
    return out;
  },
  async putBlob(base64) {
    const id = crypto.randomBytes(8).toString('hex');
    localBlobs.set(id, Buffer.from(base64, 'base64'));
    return id;
  },
  async commit({ files, uploads, deletes }) {
    uploads.forEach(u => {
      const buf = localBlobs.get(u.blob);
      if (!buf) throw fail(400, 'upload', 'blob gone: ' + u.path);
      fs.mkdirSync(path.dirname(path.join(ROOT, u.path)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, u.path), buf);
    });
    Object.keys(files).forEach(p => fs.writeFileSync(path.join(ROOT, p), files[p]));
    deletes.forEach(p => { try { fs.unlinkSync(path.join(ROOT, p)); } catch (e) { /* already gone */ } });
    return 'local';
  }
};

function store() {
  return process.env.ADMIN_STORE === 'local' ? localStore : githubStore;
}

module.exports = {
  FILES, UPLOAD_PATH, MAX_IMAGE_BYTES,
  route, json, fail, setSession, clearSession, hasSession, checkPassword,
  parseData, serialize, validate, imagePaths, gitSha, store
};
