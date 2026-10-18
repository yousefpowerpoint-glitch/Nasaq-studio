/* POST { path, base64 }: stores one image in the repo's object store and returns its id.
   Nothing is published until a save commits it. The dashboard shrinks images to WebP first. */
const { route, json, fail, store, UPLOAD_PATH, MAX_IMAGE_BYTES } = require('./_lib');

const MAGIC = {
  webp: b => b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP',
  jpg: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
  png: b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
};

module.exports = route(['POST'], async (req, res) => {
  const { path, base64 } = req.body || {};
  if (typeof path !== 'string' || !UPLOAD_PATH.test(path)) throw fail(400, 'path', 'bad path');
  if (typeof base64 !== 'string' || !base64) throw fail(400, 'image', 'no image');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length > MAX_IMAGE_BYTES) throw fail(413, 'size', 'image over 3 MB');
  const ext = path.split('.').pop();
  if (!MAGIC[ext](buf)) throw fail(400, 'image', 'not a ' + ext + ' file');
  const blob = await store().putBlob(buf.toString('base64'));
  json(res, 200, { path, blob });
});
