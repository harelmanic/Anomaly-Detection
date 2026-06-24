// TealVue returns "2026-05-04 09:15:01+05:30" — space instead of T
// new Date() parses this inconsistently, so we normalise it first
function parseTs(ts) {
  if (!ts) return new Date();
  return new Date(ts.replace(" ", "T"));
}

module.exports = { parseTs };