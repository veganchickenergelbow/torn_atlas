// Guess matching, ported from the original Torn Atlas prototype's text helpers.
const norm = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\bst\b\.?/g, "saint").replace(/[^a-z]+/g, " ").replace(/^the /, "").trim();

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let p = [...Array(n + 1).keys()];
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}

const AL = [];
LIST.forEach((cc) => {
  const s = new Set([...WORLD[cc].al, ...(ALIASES_ASEAN[cc] || []).map(norm)]);
  s.forEach((a) => { if (a) AL.push([a, cc]); });
});
const AMBIG = { congo: ["CD", "CG"], korea: ["KR", "KP"] };

function matchCountry(input, target) {
  const g = norm(input);
  if (!g) return { cc: null };
  if (AMBIG[g]) return { amb: AMBIG[g] };
  const exact = AL.filter(([a]) => a === g).map((x) => x[1]);
  if (exact.length) return { cc: exact.includes(target) ? target : exact[0] };
  let bd = 99, hits = new Set();
  for (const [a, cc] of AL) {
    if (Math.abs(a.length - g.length) > bd) continue;
    const d = lev(g, a);
    if (d < bd) { bd = d; hits = new Set([cc]); }
    else if (d === bd) hits.add(cc);
  }
  const tol = g.length >= 7 ? 2 : g.length >= 4 ? 1 : 0;
  if (bd > tol) return { cc: null };
  return { cc: hits.has(target) ? target : [...hits][0] };
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BLANK = '<span class="blank">▢▢▢</span>';
function redact(cc, text) {
  const terms = [...(REDACT[cc] || []), NM(cc)].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(^|[^\\p{L}])(${terms.map(escRe).join("|")})(?=[^\\p{L}]|$)`, "giu");
  return text.replace(re, (m, pre) => pre + BLANK);
}
const blanks = (t) => esc(t).replace(/▢/g, BLANK);
