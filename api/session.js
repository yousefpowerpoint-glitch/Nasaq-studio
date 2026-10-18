/* GET: is this browser signed in, and is the dashboard set up?
   "missing" names settings that are absent (never their values), so the setup screen can say which. */
const { route, json, hasSession } = require('./_lib');

module.exports = route(['GET'], async (req, res) => {
  const local = process.env.ADMIN_STORE === 'local';
  const missing = [];
  if (!local && !process.env.GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!local && !process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
  else if (!local && process.env.ADMIN_PASSWORD.length < 10) missing.push('ADMIN_PASSWORD_SHORT');
  json(res, 200, { loggedIn: hasSession(req), configured: !missing.length, missing });
}, { open: true });
