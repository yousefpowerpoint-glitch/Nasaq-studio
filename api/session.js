/* GET: is this browser signed in, and is the dashboard set up? */
const { route, json, hasSession } = require('./_lib');

module.exports = route(['GET'], async (req, res) => {
  json(res, 200, {
    loggedIn: hasSession(req),
    configured: process.env.ADMIN_STORE === 'local' ||
      (!!process.env.GITHUB_TOKEN && (process.env.ADMIN_PASSWORD || '').length >= 10)
  });
}, { open: true });
