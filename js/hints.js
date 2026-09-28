// Hint planning, adapted from the original Torn Atlas prototype's planHints().
// The flag is now the question itself, so the "The flag" reveal hint is
// dropped; the region/neighbours hint gains a mini "where it is" globe.
const MAX_HINTS = 5;

function planHints(cc) {
  const W = WORLD[cc], H = W.hint || { fact: [], flag: [], food: [], hist: [] }, F = C[cc], I = INFO[cc], out = [];
  const hist = shuffle(H.hist || []);
  if (W.asean && I) {
    out.push({ label: "Fun fact", html: redact(cc, rnd(I.facts)) });
    out.push({ label: "The flag's colours", html: redact(cc, rnd(F.meaning)) });
    const [d, desc] = rnd(I.dishes);
    out.push({ label: "Food", html: redact(cc, `${d}: ${desc}`) });
  } else {
    out.push(H.fact.length ? { label: "Fun fact", html: blanks(rnd(H.fact)) } : { label: "History", html: blanks(hist.shift() || "") });
    out.push(H.flag.length ? { label: "About the flag", html: blanks(rnd(H.flag)) } : { label: "History", html: blanks(hist.shift() || rnd(H.fact) || "") });
    if (H.food.length) out.push({ label: "Food", html: blanks(rnd(H.food)) });
    else if (hist.length) out.push({ label: "History", html: blanks(hist.shift()) });
    else out.push({ label: "Languages", html: esc(`People here speak ${listJoin(W.langs.slice(0, 3))}.`) });
  }
  const nb = W.nb.map(NM);
  out.push({
    label: "Where it is",
    html: `<div class="hint-region">${globeHTML(cc, { hideName: true, cls: "mini" })}<p>It's in ${esc(W.sub)}${W.sub.includes(W.ct.split(" ")[0]) ? "" : ` (${esc(W.ct)})`}. ${nb.length ? `It borders ${esc(listJoin(nb))}.` : "It has no land borders."}</p></div>`,
  });
  const nm = NM(cc), letters = nm.replace(/[^\p{L}]/gu, "").length, words = nm.split(/\s+/).length;
  out.push({ label: "The name", html: `<span class="pattern">${namePattern(nm)}</span> · ${letters} letters${words > 1 ? `, ${words} words` : ""}.` });
  return out.slice(0, MAX_HINTS);
}
