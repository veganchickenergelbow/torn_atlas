// Country dossier (bottom sheet), ported/reskinned from the original Torn Atlas prototype.
let dzTab = "flag", dzCc = null, dzOnClose = null;
let dzFactDeck = [], dzFactIdx = 0;

/* --- fun-fact card: dedupe/shuffle a deck of trivia lines per country --- */
function popRank(cc) {
  const withPop = LIST.filter((c) => WORLD[c].pop && WORLD[c].pop.v);
  const sorted = withPop.slice().sort((a, b) => WORLD[b].pop.v - WORLD[a].pop.v);
  return { rank: sorted.indexOf(cc) + 1, n: sorted.length };
}
function numberFacts(cc) {
  const W = WORLD[cc], nm = esc(NM(cc)), out = [];
  if (W.pop && W.pop.v) {
    const { rank, n } = popRank(cc);
    out.push(`${nm} is the <b>${nf(rank)}${ordSuffix(rank)}</b> most populous country out of ${n}, with about ${fmtPop(W.pop.v)} people (${W.pop.y}).`);
  }
  if (W.area) out.push(`It covers about <b>${nf(Math.round(W.area))} km²</b>.`);
  out.push(
    W.nb && W.nb.length
      ? `It has <b>${W.nb.length}</b> land neighbour${W.nb.length === 1 ? "" : "s"}.`
      : W.island
      ? `It's an <b>island nation</b>, with no land borders.`
      : `It's <b>landlocked</b>, with no land borders.`
  );
  if (W.langs && W.langs.length) out.push(`It has <b>${W.langs.length}</b> official language${W.langs.length === 1 ? "" : "s"}: ${esc(listJoin(W.langs))}.`);
  if (W.sub) out.push(`It's part of <b>${esc(W.sub)}</b>, in ${esc(W.ct)}.`);
  return out;
}
function ordSuffix(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
}
// The ▢ in WORLD[cc].hint.* stands in for whatever term was redacted at
// data-authoring time — the country name, its demonym, its capital, or other
// proper nouns — so blindly filling it with the country name produces wrong
// facts (e.g. "▢ is the country's capital" -> "Japan is the country's
// capital"). The raw (unredacted) text still lives in WORLD[cc].wk.*, so we
// recover each blank by matching the sentence's literal, non-blank pieces
// against those Wikipedia paragraphs and reading back what filled the gap.
// If that match isn't exact and unique, the fact is dropped rather than guessed.
function wkCorpus(cc) {
  const wk = WORLD[cc].wk || {};
  const parts = [];
  ["country", "flag", "cuisine", "history"].forEach((k) => { if (wk[k]) parts.push(...wk[k].p); });
  return parts;
}
function restoreBlanks(cc, sentence) {
  if (!sentence.includes("▢")) return sentence;
  const segs = sentence.split("▢");
  let re;
  try { re = new RegExp(segs.map(escRe).join("([^.!?]+?)")); } catch (e) { return null; }
  const corpus = wkCorpus(cc);
  let match = null, count = 0;
  for (const p of corpus) {
    const m = p.match(re);
    if (m) { count++; if (count === 1) match = m; else break; }
  }
  if (count !== 1) return null;
  let out = "";
  for (let i = 0; i < segs.length; i++) { out += segs[i]; if (i < segs.length - 1) out += match[i + 1]; }
  return out.trim();
}
function factsFor(cc) {
  const W = WORLD[cc], I = INFO[cc], H = W.hint || {};
  const seen = new Set();
  const deck = [];
  const fill = (t) => { const r = restoreBlanks(cc, t); return r === null ? null : esc(r); };
  const add = (tag, html) => {
    if (html === null) return;
    const key = html.replace(/<[^>]+>/g, "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    deck.push({ tag, html });
  };
  if (I && I.facts) I.facts.forEach((t) => add("Fun fact", esc(t)));
  (H.fact || []).forEach((t) => add("Fun fact", fill(t)));
  (H.food || []).forEach((t) => add("Food", fill(t)));
  (H.flag || []).forEach((t) => add("Flag", fill(t)));
  if (typeof FLAG_NOTE !== "undefined" && FLAG_NOTE[cc]) add("Flag", esc(FLAG_NOTE[cc]));
  (H.hist || []).forEach((t) => add("History", fill(t)));
  numberFacts(cc).forEach((t) => add("By the numbers", t));
  return deck;
}
function funfactCardHTML() {
  const total = dzFactDeck.length;
  if (!total) return "";
  const f = dzFactDeck[dzFactIdx];
  return `<div class="funfact" id="dz-funfact">
    <div class="ff-top"><span class="ff-eyebrow">Did you know? · <span data-role="ff-count">${dzFactIdx + 1} of ${total}</span></span><span class="ff-tag" data-role="ff-tag">${esc(f.tag)}</span></div>
    <p class="ff-text" data-role="ff-text">${f.html}</p>
    ${total > 1 ? `<button class="ff-btn" type="button" data-act="another-fact">🔀 Another fact</button>` : ""}
  </div>`;
}
function nextFact() {
  Audio2.sfxClick();
  const prev = dzFactDeck[dzFactIdx];
  dzFactIdx++;
  if (dzFactIdx >= dzFactDeck.length) {
    let nd = shuffle(dzFactDeck);
    if (nd.length > 1 && nd[0].html === prev.html) [nd[0], nd[1]] = [nd[1], nd[0]];
    dzFactDeck = nd;
    dzFactIdx = 0;
  }
  const $card = $("#dz-funfact");
  if (!$card) return;
  const f = dzFactDeck[dzFactIdx];
  $card.querySelector("[data-role='ff-count']").textContent = `${dzFactIdx + 1} of ${dzFactDeck.length}`;
  $card.querySelector("[data-role='ff-tag']").textContent = f.tag;
  $card.querySelector("[data-role='ff-text']").innerHTML = f.html;
  $card.classList.remove("ff-anim");
  void $card.offsetWidth;
  $card.classList.add("ff-anim");
}

function wikiParas(w) {
  if (!w) return `<p class="muted">No Wikipedia summary found.</p>`;
  return w.p.map((p) => `<p>${esc(p)}</p>`).join("") + `<p class="src">From Wikipedia's <a href="${w.u}" target="_blank" rel="noopener">${esc(w.t)}</a> article (CC BY-SA 4.0).</p>`;
}
function rankAmong(key, cc) {
  const vals = LIST.map((c) => WORLD[c].ec && WORLD[c].ec[key]).filter(Boolean).map((x) => x.v);
  const v = WORLD[cc].ec[key].v;
  return { below: vals.filter((x) => x < v).length, n: vals.length };
}
function econHTML(cc) {
  const W = WORLD[cc], E = W.ec || {}, S = ECON_SRC, nm = esc(NM(cc));
  let h = `<h3>Median income</h3>`;
  if (E.med) {
    const r = rankAmong("med", cc), month = (E.med.v * 365) / 12;
    h += `<div class="median-card"><div><span class="bignum">$${E.med.v.toFixed(2)}</span><span class="unit"> a day per person</span></div><div class="sub">About $${nf(Math.round(month))} a month · survey year ${E.med.y}</div>
      <div class="rank-track" aria-hidden="true"><i style="left:${((r.below / (r.n - 1)) * 100).toFixed(1)}%"></i></div><div class="sub">Higher than ${r.below} of the ${r.n} countries with data.</div></div>
      <p>Half the people in ${nm} live on less than this. It counts everyone, not only workers: for richer countries it's income after taxes and benefits, and for most lower-income countries it's what people spend (consumption). Figures are in international dollars at 2021 prices.</p>`;
  } else h += `<p>The World Bank has no comparable household survey for ${nm}, so there's no median figure.</p>`;
  h += `<p class="src">Source: <a href="${S.median.url}" target="_blank" rel="noopener">${esc(S.median.label)}</a>.</p>`;
  if (E.gdp) {
    const r = rankAmong("gdp", cc);
    h += `<h3>GDP per person</h3><p><span class="bignum sm">$${nf(E.gdp.v)}</span> in ${E.gdp.y}, adjusted for cost of living. Higher than ${r.below} of ${r.n} countries.</p><p class="src">Source: <a href="${S.gdp.url}" target="_blank" rel="noopener">${esc(S.gdp.label)}</a>.</p>`;
  }
  if (E.gini) {
    const g = E.gini.v;
    h += `<h3>How evenly income is shared</h3><div class="gini"><div class="gini-track"><i style="left:${Math.max(0, Math.min(100, ((g - 20) / (65 - 20)) * 100)).toFixed(1)}%"></i></div><div class="gini-scale"><span>20 · more equal</span><span>65 · less equal</span></div></div>
      <p>Gini index <b>${g}</b> (${E.gini.y}). 0 would mean everyone has the same income; most countries fall between 25 and 60.</p><p class="src">Source: <a href="${S.gini.url}" target="_blank" rel="noopener">${esc(S.gini.label)}</a>.</p>`;
  }
  return h;
}
function dishesHTML(dishArr, cc) {
  return `<h3>National dishes</h3><dl class="dishes">${dishArr
    .map(([n, d]) => {
      const ph = typeof DISH_PHOTOS !== "undefined" && cc ? DISH_PHOTOS[cc + "::" + n] : null;
      const img = ph ? `<img class="dish-photo" src="${ph.d}" alt="${esc(n)}" loading="lazy" decoding="async"><p class="src">Photo: ${esc(ph.by || "")} · ${esc(ph.lic || "")}${ph.page ? ` · <a href="${ph.page}" target="_blank" rel="noopener">source</a>` : ""}</p>` : "";
      return `<div><dt>${esc(n)}</dt><dd>${esc(d)}${img}</dd></div>`;
    })
    .join("")}</dl>`;
}
function panelsFor(cc) {
  const W = WORLD[cc], F = C[cc], I = INFO[cc], nm = esc(NM(cc));
  const place = `${globeHTML(cc)}<div><p class="eyebrow">Capital city</p><p class="cap-name">${esc(W.asean && I ? I.capital.name : W.cap)}</p>
    <dl class="facts compact"><div><dt>Region</dt><dd>${esc(W.sub)} · ${esc(W.ct)}</dd></div><div><dt>Languages</dt><dd>${esc((W.langs || []).join(", ") || "—")}</dd></div>
    <div><dt>Neighbours</dt><dd>${W.nb.length ? W.nb.map((n) => `<button class="link-btn" data-act="dz" data-cc="${n}">${esc(NM(n))}</button>`).join(", ") : "No land borders"}</dd></div></dl></div>`;
  if (W.asean && I) {
    const E = I.economy;
    return [
      ["flag", "The flag", `<dl class="facts"><div><dt>Flag adopted</dt><dd>${F.adopted}</dd></div>${F.flagName ? `<div><dt>Flag's name</dt><dd>${F.flagName}</dd></div>` : ""}<div><dt>Proportions</dt><dd>${F.rl}</dd></div></dl>
        <h3>What the flag means</h3><ul>${F.meaning.map((m) => `<li>${m}</li>`).join("")}</ul>`],
      ["country", "The country", `<div class="country-top">${place}</div><p>${I.capital.about}</p><h3>Known for</h3><ul>${I.knownFor.map((k) => `<li>${k}</li>`).join("")}</ul>
        ${dishesHTML(I.dishes, cc)}`],
      ["history", "History", `<h3>How it came to be</h3><p>${I.founding}</p><h3>Timeline</h3><ol class="timeline">${I.timeline.map(([y, t]) => `<li><span class="yr">${y}</span><span>${t}</span></li>`).join("")}</ol>`],
      ["numbers", "Numbers", `<dl class="facts"><div><dt>Population</dt><dd>${I.population}</dd></div><div><dt>GDP per person</dt><dd><span class="bignum sm">US$${E.gdpPc.toLocaleString("en-US")}</span><br><span class="src">IMF estimate for 2025, at market exchange rates</span></dd></div></dl>
        ${econHTML(cc)}
        <h3>Religion</h3>${barRows(I.religion.data)}
        <p class="src">Share of population${I.religion.year ? `, ${I.religion.year}` : ""}, as cited in Wikipedia's ${nm} infobox.</p>
        <h3>Where the income comes from</h3>${barRows([["Agriculture", E.sectors[0]], ["Industry", E.sectors[1]], ["Services", E.sectors[2]]])}
        <p><b>What drives it:</b> ${E.drivers}</p>`],
    ];
  }
  const tabs = [
    ["flag", "The flag", `<dl class="facts"><div><dt>Proportions</dt><dd>${ratioText(W.r)} (height to width)</dd></div><div><dt>Main colours</dt><dd>${esc((W.col || []).map((c) => COLNAME[c] || c).join(", "))}</dd></div></dl>${FLAG_NOTE[cc] ? `<p class="callout">${esc(FLAG_NOTE[cc])}</p>` : ""}${wikiParas(W.wk.flag)}`],
    ["country", "The country", `<div class="country-top">${place}</div>${wikiParas(W.wk.country)}`],
  ];
  const dishes = DISHES[cc];
  if (dishes) tabs.push(["food", "Food", dishesHTML(dishes, cc)]);
  else if (W.wk.cuisine) tabs.push(["food", /cuisine|food/i.test(W.wk.cuisine.t) ? "Food" : "Culture", wikiParas(W.wk.cuisine)]);
  tabs.push(["history", "History", wikiParas(W.wk.history)]);
  tabs.push(["numbers", "Numbers", `<dl class="facts"><div><dt>Population</dt><dd>${W.pop ? `${fmtPop(W.pop.v)} <span class="src">(${W.pop.y}, UN estimate)</span>` : "—"}</dd></div><div><dt>Area</dt><dd>${nf(Math.round(W.area))} km²</dd></div></dl>${econHTML(cc)}`]);
  return tabs;
}
function photosFor(cc) {
  const W = WORLD[cc], I = INFO[cc];
  if (W.asean && I) return I.photos.map((p) => ({ src: "/photos/" + p.file, cap: p.cap, by: p.by, lic: p.lic, u: p.url }));
  return (W.ph || []).map((p) => ({ src: "/photos/" + p.f, cap: (p.k === "cap" ? `${W.cap}: ` : "") + p.cap.replace(/\.(jpe?g|png)$/i, ""), by: p.by, lic: p.lic, u: p.u }));
}
const ODO_NOTES = [
  "Odo says the best way to learn a country is to get delightfully lost in it.",
  "Odo has a whole notebook of misadventures from this part of the map.",
  "Odo insists every capital city has at least one good pigeon story.",
  "Odo says the flag always has a story behind it, if you look closely.",
];
function showDossier(cc, { onClose, keep } = {}) {
  if (!keep) dzOnClose = onClose || null;
  dzCc = cc;
  Audio2.sfxOpen();
  const W = WORLD[cc];
  const tabs = panelsFor(cc);
  if (!tabs.some((t) => t[0] === dzTab)) dzTab = tabs[0][0];
  const ph = photosFor(cc);
  dzFactDeck = shuffle(factsFor(cc));
  dzFactIdx = 0;
  const capital = W.asean && INFO[cc] ? INFO[cc].capital.name : W.cap;
  const $sheet = $("#sheet");
  $sheet.hidden = false;
  $sheet.innerHTML = `
    <div class="sheet dossier-sheet">
      <div class="sheet-top"><button class="icon-btn" id="btn-close-sheet">✕</button></div>
      <div class="dz-photos n${ph.length}">${ph.map((p) => `<figure><img src="${p.src}" alt="${esc(p.cap)}" loading="lazy" decoding="async"><figcaption>${esc(p.cap)}<br><a href="${p.u}" target="_blank" rel="noopener">Photo: ${esc(p.by)} · ${esc(p.lic)}</a></figcaption></figure>`).join("")}</div>
      <div class="sheet-head">
        <div class="sheet-head-id">
          ${flagImg(cc, "Flag of " + NM(cc), "flag-huge")}
          <div><h2>${esc(NM(cc))}</h2><span>${esc(capital)}</span></div>
        </div>
        ${funfactCardHTML()}
      </div>
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="tab ${k === dzTab ? "on" : ""}" role="tab" data-act="tab" data-tab="${k}">${l}</button>`).join("")}</div>
      ${tabs.map(([k, , html]) => `<section class="panel" ${k === dzTab ? "" : "hidden"} data-panel="${k}">${html}</section>`).join("")}
      <div class="odo-note"><div class="av">🦜</div><p>${rnd(ODO_NOTES)}</p></div>
      <button class="btn ok" id="btn-sheet-continue">Continue</button>
    </div>`;
  $sheet.scrollTop = 0;
  drawGlobes($sheet);
  $sheet.querySelectorAll("[data-act='tab']").forEach((btn) => (btn.onclick = () => { Audio2.sfxClick(); setTab(btn.dataset.tab); }));
  $sheet.querySelectorAll("[data-act='dz']").forEach((btn) => (btn.onclick = () => { Audio2.sfxClick(); showDossier(btn.dataset.cc, { keep: true }); }));
  $sheet.querySelectorAll("[data-act='another-fact']").forEach((btn) => (btn.onclick = nextFact));
  const close = () => closeDossier();
  $("#btn-close-sheet").onclick = close;
  $("#btn-sheet-continue").onclick = close;
}
function setTab(k) {
  dzTab = k;
  const $sheet = $("#sheet");
  $sheet.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === k));
  $sheet.querySelectorAll(".panel").forEach((p) => (p.hidden = p.dataset.panel !== k));
  drawGlobes($sheet);
}
function closeDossier() {
  const $sheet = $("#sheet");
  $sheet.hidden = true;
  $sheet.innerHTML = "";
  const f = dzOnClose;
  dzOnClose = null;
  if (f) f();
}
