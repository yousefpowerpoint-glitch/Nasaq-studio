/* POST: clears the session cookie. */
const { route, json, clearSession } = require('./_lib');

module.exports = route(['POST'], async (req, res) => {
  clearSession(res);
  json(res, 200, { ok: true });
}, { open: true });
