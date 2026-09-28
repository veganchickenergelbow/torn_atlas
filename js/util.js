// Small shared helpers, ported from the original Torn Atlas prototype.
const $ = (s, root = document) => root.querySelector(s);
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const listJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
function namePattern(nm) {
  return nm.split(/(\s+|-)/).map((w) => (/^\s+$|^-$/.test(w) ? (w === "-" ? "-" : "&nbsp;&nbsp;") : w[0] + "_".repeat(Math.max(0, [...w].length - 1)))).join("");
}

/* --- flags --- */
const flagSrc = (cc) => `/flags/${cc.toLowerCase()}.svg`;
const ratioOf = (cc) => (WORLD[cc] && WORLD[cc].r) || 0.6667;
const BROKEN_FLAGS = new Set();
function flagImg(cc, label, cls = "") {
  const a = label ? `alt="${esc(label)}"` : `alt="" aria-hidden="true"`;
  const fallback = `https://flagcdn.com/${cc.toLowerCase()}.svg`;
  return `<img class="flag-img ${cls}" src="${flagSrc(cc)}" ${a} loading="lazy" decoding="async" style="aspect-ratio:${(1 / ratioOf(cc)).toFixed(4)}" onerror="if(this.src!=='${fallback}'){this.onerror=null;this.src='${fallback}';}else{BROKEN_FLAGS.add('${cc}');this.onerror=null;}">`;
}

/* --- numbers --- */
const nf = (n) => n.toLocaleString("en-US");
function fmtPop(v) {
  return v >= 1e9 ? (v / 1e9).toFixed(2) + " billion" : v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + " million" : nf(Math.round(v / 100) * 100);
}
function ratioText(r) {
  for (let d = 1; d <= 40; d++) {
    const n = Math.round(r * d);
    if (n && Math.abs(n / d - r) < 0.004) return `${n}:${d}`;
  }
  return `${r.toFixed(3)} : 1`;
}
const pctFmt = (v) => (v < 0.1 ? "<0.1%" : (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "") + "%");
function barRows(rows) {
  return `<div class="bars">${rows
    .map(
      ([l, v]) =>
        `<div class="bar-row" title="${esc(l)}: ${pctFmt(v)}"><span class="bar-label">${esc(l)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(0.6, Math.min(100, v))}%"></span></span><span class="bar-val">${pctFmt(v)}</span></div>`
    )
    .join("")}</div>`;
}
const COLNAME = { red: "red", white: "white", blue: "dark blue", lightblue: "light blue", green: "green", yellow: "yellow or gold", black: "black", orange: "orange" };

/* --- lists --- */
const LIST = Object.keys(WORLD).sort((a, b) => WORLD[a].n.localeCompare(WORLD[b].n));
const NM = (cc) => WORLD[cc].n;
