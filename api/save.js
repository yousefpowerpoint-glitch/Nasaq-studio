/* POST { data: { site, projects, brands }, versions, uploads: [{ path, blob }] }
   Writes the three data files and the new images in one commit on main, and removes
   images the data no longer points at. Vercel then redeploys the site. */
const { route, json, fail, store, parseData, serialize, validate, imagePaths, gitSha, FILES, UPLOAD_PATH } = require('./_lib');

module.exports = route(['POST'], async (req, res) => {
  const body = req.body || {};
  const data = body.data;
  validate(data);

  const s = store();
  const current = await s.read();
  // Refuse to overwrite changes made elsewhere (another tab, or a code push) since the page loaded.
  const versions = body.versions || {};
  const stale = Object.keys(FILES).filter(k => versions[k] !== current[k].sha);
  if (stale.length) throw fail(409, 'stale', stale.join(', '));

  const before = new Set();
  Object.keys(FILES).forEach(k => imagePaths(parseData(k, current[k].text)).forEach(p => before.add(p)));
  const after = imagePaths(data);

  const uploads = (Array.isArray(body.uploads) ? body.uploads : [])
    .filter(u => u && UPLOAD_PATH.test(u.path) && typeof u.blob === 'string' && after.has(u.path));
  const uploaded = new Set(uploads.map(u => u.path));
  const missing = [...after].filter(p => !before.has(p) && !uploaded.has(p));
  if (missing.length) throw fail(400, 'missing', 'images not uploaded: ' + missing.join(', '));
  const deletes = [...before].filter(p => !after.has(p));

  const files = {}, next = {};
  Object.keys(FILES).forEach(k => {
    const text = serialize(k, data[k]);
    if (text !== current[k].text) files[FILES[k].path] = text;
    next[k] = gitSha(text);
  });
  if (!Object.keys(files).length && !uploads.length && !deletes.length) return json(res, 200, { ok: true, unchanged: true, versions });

  const sha = await s.commit({
    files, uploads, deletes,
    message: 'Dashboard: ' + (String(body.note || '').slice(0, 72) || 'update site content')
  });
  json(res, 200, { ok: true, commit: sha, versions: next });
});
