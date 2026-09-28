// Flag Quest — guess the country from its flag.
const FOUND_KEY = "atlas-mapquest-found";
function loadFound() { try { return new Set(JSON.parse(localStorage.getItem(FOUND_KEY) || "[]")); } catch (e) { return new Set(); } }
function saveFound(s) { try { localStorage.setItem(FOUND_KEY, JSON.stringify([...s])); } catch (e) {} }

const MQ = {
  screen: "title", region: "all", roundLen: 10, queue: [], idx: 0, cc: null, hints: [], wrong: [],
  done: false, gaveUp: false, sessionStars: 0, sessionInk: 0, sessionFound: [], found: loadFound(),
};

const REGIONS = [["all", "Whole world"], ...Object.keys(CONTINENTS).map((k) => [k, k])];
const deckOf = (k) => (k === "all" ? LIST : CONTINENTS[k] || LIST);

const $screen2 = () => $("#screen");
const $hud2 = () => $("#hud");

function mqRender() {
  mqHud();
  const s = $screen2();
  if (MQ.screen === "title") return renderMqTitle(s);
  if (MQ.screen === "setup") return renderMqSetup(s);
  if (MQ.screen === "round") return renderMqRound(s);
  if (MQ.screen === "end") return renderMqEnd(s);
  if (MQ.screen === "atlas") return renderMqAtlas(s);
  if (MQ.screen === "utopia") return Utopia.render(s);
}
function mqHud() {
  const h = $hud2();
  if (MQ.screen === "title") { h.innerHTML = ""; return; }
  h.innerHTML = `
    <button class="logo" id="btn-home">🚩 Flag Quest</button>
    <div class="hud-mid">${MQ.screen === "round" ? `<div class="prog"><i style="width:${((MQ.idx) / MQ.queue.length) * 100}%"></i></div>` : ""}</div>
    ${Utopia.pawMeterHTML()}
    <div class="ink-count">🪙 ${MQ.sessionInk}</div>
    <div class="hud-toggles">
      <button class="icon-btn" id="btn-utopia" title="Cat Utopia">🐱</button>
      <button class="icon-btn" id="btn-theme" title="Toggle dark mode">${isDark2() ? "☀️" : "🌙"}</button>
      <button class="icon-btn ${Audio2.sfxOn ? "" : "off"}" id="btn-sfx">🔔</button>
      <button class="icon-btn ${Audio2.musicOn ? "" : "off"}" id="btn-music">🎵</button>
    </div>`;
  MQ.pawPulse = false;
  $("#btn-home").onclick = () => { MQ.screen = "title"; mqRender(); };
  $("#btn-utopia").onclick = () => { MQ.screen = "utopia"; mqRender(); };
  $("#btn-utopia-paw").onclick = () => { MQ.screen = "utopia"; mqRender(); };
  $("#btn-theme").onclick = toggleTheme2;
  $("#btn-sfx").onclick = () => { Audio2.toggleSfx(); mqHud(); };
  $("#btn-music").onclick = () => { Audio2.toggleMusic(); mqHud(); };
}
function isDark2() {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function toggleTheme2() {
  const curDark = isDark2();
  const next = curDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("atlas-theme", next);
  mqRender();
}

function renderMqTitle(s) {
  s.innerHTML = `
    <div class="home">
      <div class="hero panel">
        <div class="big-flag">🗺️</div>
        <h1>Torn Atlas</h1>
        <p class="tagline">Study the flag, name the country, and rebuild the atlas one dossier at a time.</p>
        <div class="mode-cards">
          <button class="mode-card primary" id="btn-mapquest"><b>Flag Quest</b><span>Name the country from its flag</span></button>
          <a class="mode-card" href="/variants/flag-voyage/"><b>Flag Voyage</b><span>The original flag-picking voyage</span></a>
          <button class="mode-card" id="btn-utopia-card"><b>🐱 Cat Utopia (${Cats.cats.length} cats)</b><span>Visit the cats you've adopted</span></button>
        </div>
        <div class="guide-row"><div class="av">🦜</div><span class="pip-badge">🧭</span><p>${esc(Utopia.guideLine())}</p></div>
        <button class="btn ghost" id="btn-myatlas">My Atlas (${MQ.found.size} found)</button>
      </div>
    </div>`;
  $("#btn-mapquest").onclick = () => { MQ.screen = "setup"; mqRender(); };
  $("#btn-myatlas").onclick = () => { MQ.screen = "atlas"; mqRender(); };
  $("#btn-utopia-card").onclick = () => { MQ.screen = "utopia"; mqRender(); };
}

function renderMqSetup(s) {
  s.innerHTML = `
    <div class="home">
      <div class="panel setup-panel">
        <h2>Set up your quest</h2>
        <p class="eyebrow">Region</p>
        <div class="chip-row">${REGIONS.map(([k, l]) => `<button class="chip ${MQ.region === k ? "on" : ""}" data-region="${k}">${esc(l)}</button>`).join("")}</div>
        <p class="eyebrow">Round length</p>
        <div class="chip-row">${[5, 10, 15, 20].map((n) => `<button class="chip ${MQ.roundLen === n ? "on" : ""}" data-len="${n}">${n}</button>`).join("")}</div>
        <button class="btn" id="btn-begin">Start</button>
      </div>
    </div>`;
  s.querySelectorAll("[data-region]").forEach((b) => (b.onclick = () => { MQ.region = b.dataset.region; renderMqSetup(s); }));
  s.querySelectorAll("[data-len]").forEach((b) => (b.onclick = () => { MQ.roundLen = Number(b.dataset.len); renderMqSetup(s); }));
  $("#btn-begin").onclick = beginRound;
}

function beginRound() {
  const pool = shuffle(deckOf(MQ.region).filter((cc) => !BROKEN_FLAGS.has(cc)));
  MQ.queue = pool.slice(0, Math.min(MQ.roundLen, pool.length));
  MQ.idx = 0;
  MQ.sessionStars = 0;
  MQ.sessionInk = 0;
  MQ.sessionFound = [];
  MQ.roundStars = {};
  MQ.bonusChecked = false;
  nextCountry();
}
function checkPerfectRunBonus() {
  if (MQ.bonusChecked) return;
  MQ.bonusChecked = true;
  const rs = MQ.roundStars || {};
  if (MQ.queue.length >= 5 && MQ.queue.every((cc) => rs[cc] === 3)) {
    const reward = Cats.awardBonus(MQ.queue[MQ.queue.length - 1]);
    if (typeof Utopia !== "undefined") Utopia.queueReward(reward);
  }
}
function nextCountry() {
  if (typeof Utopia !== "undefined" && Utopia.rewardQueue.length) return Utopia.showNextReward(nextCountry);
  if (MQ.idx >= MQ.queue.length) {
    checkPerfectRunBonus();
    if (typeof Utopia !== "undefined" && Utopia.rewardQueue.length) return Utopia.showNextReward(nextCountry);
    MQ.screen = "end";
    return mqRender();
  }
  MQ.cc = MQ.queue[MQ.idx];
  MQ.hints = [];
  MQ.wrong = [];
  MQ.done = false;
  MQ.gaveUp = false;
  MQ.plan = planHints(MQ.cc);
  MQ.screen = "round";
  mqRender();
}

function renderMqRound(s) {
  const cc = MQ.cc, total = MQ.queue.length;
  s.innerHTML = `
    <div class="enc mq-round">
      <div class="enc-head"><p class="eyebrow">Country ${MQ.idx + 1} of ${total}</p><h2>Whose flag is this?</h2></div>
      <div class="flag-wrap panel">${flagImg(cc, "The flag to name", "flag-big")}</div>
      <div class="clue-card panel"><div class="speaker odo"><div class="av">🦜</div><div class="bubble-txt"><div class="who">Odo</div><p id="odo-line">Whose flag is this?</p></div></div></div>
      <form id="guessForm" class="guess-form" autocomplete="off">
        <input id="guessInput" placeholder="Type the country…" autocomplete="off" autocapitalize="words" spellcheck="false">
        <button class="btn" type="submit">Guess</button>
      </form>
      <div id="wrongNote">${MQ.wrong.length ? wrongNoteHTML() : ""}</div>
      <ol class="hint-list" id="hintList">${MQ.hints.map((h) => `<li><span class="eyebrow">${esc(h.label)}</span><div class="hint-body">${h.html}</div></li>`).join("")}</ol>
      <div class="btn-row center">
        <button class="btn ghost" id="btn-hint" ${MQ.hints.length >= MQ.plan.length ? "disabled" : ""}>⭐ ${MQ.hints.length >= MQ.plan.length ? "No more hints" : `Hint (${MQ.hints.length + 1} of ${MQ.plan.length})`}</button>
        <button class="btn ghost" id="btn-giveup">Give up</button>
      </div>
    </div>`;
  $("#guessForm").onsubmit = (e) => { e.preventDefault(); const v = $("#guessInput").value; $("#guessInput").value = ""; handleGuess(v); };
  $("#btn-hint").onclick = () => { Audio2.sfxClick(); showHint(); };
  $("#btn-giveup").onclick = () => { Audio2.sfxClick(); giveUp(); };
  $("#guessInput").focus({ preventScroll: true });
}

function showHint() {
  if (MQ.hints.length >= MQ.plan.length) return;
  MQ.hints.push(MQ.plan[MQ.hints.length]);
  $("#hintList").innerHTML = MQ.hints.map((h) => `<li><span class="eyebrow">${esc(h.label)}</span><div class="hint-body">${h.html}</div></li>`).join("");
  drawGlobes($("#hintList"));
  const btn = $("#btn-hint");
  const maxed = MQ.hints.length >= MQ.plan.length;
  btn.disabled = maxed;
  btn.innerHTML = `⭐ ${maxed ? "No more hints" : `Hint (${MQ.hints.length + 1} of ${MQ.plan.length})`}`;
}
function handleGuess(value) {
  if (MQ.done) return;
  const m = matchCountry(value, MQ.cc);
  if (m.amb) { $("#odo-line").textContent = `Which one? There's ${listJoin(m.amb.map(NM))}.`; return; }
  if (!m.cc) { $("#odo-line").textContent = `I don't know "${value}" as a country. Check the spelling and try again.`; Audio2.sfxWrong(); return; }
  if (m.cc === MQ.cc) return correctGuess();
  wrongGuess(m.cc);
}
function wrongNoteHTML() {
  const last = MQ.wrong[MQ.wrong.length - 1];
  return `<p class="odo-note-inline">You guessed ${esc(listJoin(MQ.wrong.map(NM)))}.</p>
    <div class="their-flag"><span>${esc(NM(last))}'s flag looks like this:</span>${flagImg(last, "Flag of " + NM(last))}</div>`;
}
function reducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function spawnConfetti(container) {
  if (!container || reducedMotion()) return;
  const colors = ["var(--coral)", "var(--sun)", "var(--mint)", "var(--ice)"];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement("span");
    s.className = "confetti-piece";
    const angle = Math.random() * Math.PI * 2;
    const dist = 55 + Math.random() * 95;
    s.style.setProperty("--cx", `${(Math.cos(angle) * dist).toFixed(1)}px`);
    s.style.setProperty("--cy", `${(Math.sin(angle) * dist).toFixed(1)}px`);
    s.style.setProperty("--cr", `${(Math.random() * 360 - 180).toFixed(0)}deg`);
    s.style.background = colors[i % colors.length];
    s.style.animationDelay = `${(Math.random() * 0.1).toFixed(2)}s`;
    container.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }
}
function wrongGuess(cc) {
  Audio2.sfxWrong();
  if (!MQ.wrong.includes(cc)) MQ.wrong.push(cc);
  $("#odo-line").textContent = rnd(["Not quite — try again!", "Close-ish? Give it another go.", "Pip winces — that's not it."]);
  $("#wrongNote").innerHTML = wrongNoteHTML();
  const wrap = $(".flag-wrap"), input = $("#guessInput");
  if (input) { input.value = ""; input.focus(); }
  if (!reducedMotion()) {
    if (wrap) { wrap.classList.remove("anim-wrong"); void wrap.offsetWidth; wrap.classList.add("anim-wrong"); }
    if (input) { input.classList.remove("anim-wrong"); void input.offsetWidth; input.classList.add("anim-wrong"); }
    setTimeout(() => { if (wrap) wrap.classList.remove("anim-wrong"); if (input) input.classList.remove("anim-wrong"); }, 450);
  }
}
function starsFor(hints, misses, gaveUp) {
  if (gaveUp) return 0;
  const total = hints + misses;
  if (total === 0) return 3;
  if (total <= 2) return 2;
  return 1;
}
function correctGuess() {
  MQ.done = true;
  const stars = starsFor(MQ.hints.length, MQ.wrong.length, false);
  const wrap = $(".flag-wrap");
  if (wrap && !reducedMotion()) {
    wrap.classList.add("anim-correct");
    spawnConfetti(wrap);
    const stamp = document.createElement("div");
    stamp.className = "stamp-correct";
    stamp.textContent = "Correct!";
    wrap.appendChild(stamp);
  }
  setTimeout(() => finishCountry(stars), reducedMotion() ? 0 : 900);
}
function giveUp() {
  if (MQ.done) return;
  MQ.done = true;
  MQ.gaveUp = true;
  const note = $("#wrongNote");
  if (note) note.innerHTML = `<p class="giveup-reveal">The answer was ${esc(NM(MQ.cc))}.</p>`;
  setTimeout(() => finishCountry(0), reducedMotion() ? 0 : 700);
}
function finishCountry(stars) {
  Audio2.sfxCorrect();
  MQ.sessionStars += stars;
  MQ.sessionInk += stars * 10;
  if (!MQ.found.has(MQ.cc)) { MQ.found.add(MQ.cc); saveFound(MQ.found); }
  if (!MQ.sessionFound.includes(MQ.cc)) MQ.sessionFound.push(MQ.cc);
  if (!MQ.gaveUp) {
    MQ.roundStars = MQ.roundStars || {};
    MQ.roundStars[MQ.cc] = stars;
    if (typeof Cats !== "undefined") {
      const res = Cats.recordCorrect(MQ.cc);
      if (res.reward && typeof Utopia !== "undefined") Utopia.queueReward(res.reward);
      MQ.pawPulse = true;
      mqHud();
    }
  }
  MQ.idx++;
  showDossier(MQ.cc, { onClose: nextCountry });
}

function renderMqEnd(s) {
  s.innerHTML = `
    <div class="end panel">
      <div class="big-flag">🏆</div>
      <h2>Quest complete!</h2>
      <div class="tiles">
        <div class="stat"><b>${"★".repeat(0)}${MQ.sessionStars}</b><span>Stars</span></div>
        <div class="stat"><b>${MQ.sessionInk}</b><span>Ink Earned</span></div>
        <div class="stat"><b>${MQ.sessionFound.length}</b><span>Countries</span></div>
      </div>
      <div class="atlas-grid">${MQ.sessionFound.map((cc) => `<button class="atlas-card" data-cc="${cc}">${flagImg(cc)}<b>${esc(NM(cc))}</b></button>`).join("")}</div>
      <div class="btn-row"><button class="btn" id="btn-again">Play Again</button><button class="btn ghost" id="btn-title">Title Screen</button></div>
    </div>`;
  s.querySelectorAll("[data-cc]").forEach((b) => (b.onclick = () => showDossier(b.dataset.cc, { keep: true })));
  $("#btn-again").onclick = () => { MQ.screen = "setup"; mqRender(); };
  $("#btn-title").onclick = () => { MQ.screen = "title"; mqRender(); };
}
function renderMqAtlas(s) {
  const found = [...MQ.found].sort((a, b) => NM(a).localeCompare(NM(b)));
  s.innerHTML = `
    <div class="map-head"><h2>My Atlas</h2><p class="muted">${found.length} of ${LIST.length} countries discovered.</p></div>
    <div class="atlas-grid">${found.map((cc) => `<button class="atlas-card" data-cc="${cc}">${flagImg(cc)}<b>${esc(NM(cc))}</b></button>`).join("") || `<p class="muted">Nothing here yet — play a round of Flag Quest!</p>`}</div>
    <div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="btn-back">Back</button></div>`;
  s.querySelectorAll("[data-cc]").forEach((b) => (b.onclick = () => showDossier(b.dataset.cc, { keep: true })));
  $("#btn-back").onclick = () => { MQ.screen = "title"; mqRender(); };
}

(function initTheme2() {
  const saved = localStorage.getItem("atlas-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();
let audioUnlocked2 = false;
const unlockAudio2 = () => { if (!audioUnlocked2) { audioUnlocked2 = true; Audio2.unlock(); } };
["click", "pointerdown", "touchend"].forEach((ev) => document.addEventListener(ev, unlockAudio2, { passive: true }));
document.addEventListener("visibilitychange", () => { if (!document.hidden && audioUnlocked2) Audio2.unlock(); });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  const isLocalDev = ["localhost", "127.0.0.1"].includes(location.hostname) && !location.search.includes("sw=1");
  if (isLocalDev) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    caches.keys && caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  } else window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
location.search.includes("catsheet") ? renderCatContactSheet($screen2()) :
  location.search.includes("scenes") ? renderScenesDebugPage($screen2()) : mqRender();
