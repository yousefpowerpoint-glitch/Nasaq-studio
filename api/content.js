/* GET: the current site data, straight from the repo (not the deployed copy),
   plus the version of each file so a save can tell if something changed meanwhile. */
const { route, json, store, parseData, FILES } = require('./_lib');

module.exports = route(['GET'], async (req, res) => {
  const files = await store().read();
  const data = {}, versions = {};
  Object.keys(FILES).forEach(key => {
    data[key] = parseData(key, files[key].text);
    versions[key] = files[key].sha;
  });
  json(res, 200, { data, versions });
});
