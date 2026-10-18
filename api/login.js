/* POST { password }: sets the session cookie. */
const { route, json, setSession, checkPassword } = require('./_lib');

module.exports = route(['POST'], async (req, res) => {
  const ok = checkPassword((req.body || {}).password || '');
  if (!ok) {
    await new Promise(r => setTimeout(r, 800)); // slows down guessing
    return json(res, 401, { error: 'password' });
  }
  setSession(res);
  json(res, 200, { ok: true });
}, { open: true });
