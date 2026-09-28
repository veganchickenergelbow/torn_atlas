// Torn Atlas — flag-guessing adventure. Vanilla JS, single state object + render functions.

const state = {
  screen: "title", // title | map | encounter | end | gameover
  legIndex: 0,
  nodeIndex: 0,
  hearts: 3,
  ink: 0,
  discovered: [], // country ids, in dossier order
  progress: {}, // legId -> Set of completed node indices
  current: null, // { country, choices, answered, picked }
};

for (const leg of ALL_LEGS) state.progress[leg.id] = new Set();

const $screen = document.getElementById("screen");
const $hud = document.getElementById("hud");
const $footer = document.getElementById("footer");
const $sheet = document.getElementById("sheet");

// --- audio unlock on first interaction (browser autoplay rules) ---
let audioUnlocked = false;
document.addEventListener("click", () => {
  if (!audioUnlocked) { audioUnlocked = true; Audio2.unlock(); }
}, { once: false });

// --- theme ---
function initTheme() {
  const saved = localStorage.getItem("atlas-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const curDark = cur ? cur === "dark" : prefersDark;
  const next = curDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("atlas-theme", next);
  render();
}
initTheme();

function isDark() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr) return attr === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function totalNodes() {
  return ALL_LEGS.reduce((sum, leg) => sum + leg.countries.length, 0);
}
function totalDone() {
  return Object.values(state.progress).reduce((sum, s) => sum + s.size, 0);
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pool() {
  return ALL_LEGS.flatMap((l) => l.countries);
}
function findCountry(id) {
  return pool().find((c) => c.id === id);
}

function render() {
  renderHud();
  $footer.innerHTML = "";
  if (state.screen === "title") renderTitle();
  else if (state.screen === "map") renderMap();
  else if (state.screen === "encounter") renderEncounter();
  else if (state.screen === "end") renderEnd();
  else if (state.screen === "gameover") renderGameOver();
}

function renderHud() {
  if (state.screen === "title") { $hud.innerHTML = ""; return; }
  const pct = Math.round((totalDone() / totalNodes()) * 100);
  const heartsHtml = [0, 1, 2].map((i) =>
    i < state.hearts ? "❤️" : "<span class='off'>🤍</span>"
  ).join(" ");
  $hud.innerHTML = `
    <button class="logo" id="btn-home">🗺️ Flag Voyage</button>
    <div class="hud-mid">
      <div class="prog"><i style="width:${pct}%"></i></div>
    </div>
    <div class="hearts">${heartsHtml}</div>
    <div class="ink-count">🪙 ${state.ink}</div>
    <div class="hud-toggles">
      <button class="icon-btn" id="btn-theme" title="Toggle dark mode">${isDark() ? "☀️" : "🌙"}</button>
      <button class="icon-btn ${Audio2.sfxOn ? "" : "off"}" id="btn-sfx" title="Toggle sound effects">🔔</button>
      <button class="icon-btn ${Audio2.musicOn ? "" : "off"}" id="btn-music" title="Toggle music">🎵</button>
    </div>
  `;
  document.getElementById("btn-home").onclick = () => { window.location.href = "/"; };
  document.getElementById("btn-theme").onclick = toggleTheme;
  document.getElementById("btn-sfx").onclick = () => { Audio2.toggleSfx(); renderHud(); };
  document.getElementById("btn-music").onclick = () => { Audio2.toggleMusic(); renderHud(); };
}

function renderTitle() {
  $screen.innerHTML = `
    <div class="home">
      <div class="hero panel">
        <div class="big-flag">🗺️</div>
        <h1>Torn Atlas</h1>
        <p class="tagline">Chart a course across scattered pages of a torn atlas. Read the clue, spot the flag, and rebuild the map one country at a time.</p>
        <div class="mascots-intro">
          <div class="masc odo"><div class="face">🦜</div><span>Odo</span></div>
          <div class="masc pip"><div class="face">🧭</div><span>Pip</span></div>
        </div>
        <p class="muted" style="font-size:14px;max-width:40ch">Odo the well-traveled guide reads you each clue. Pip the compass sprite cheers you on — or winces when you miss.</p>
        <ul class="how">
          <li><span>🔍</span><div><b>Read the clue</b>Each page hints at a nation's flag and culture.</div></li>
          <li><span>🚩</span><div><b>Pick the flag</b>Choose the matching flag from four options.</div></li>
          <li><span>📖</span><div><b>Fill the dossier</b>Correct guesses unlock a full country dossier.</div></li>
          <li><span>❤️</span><div><b>Mind your hearts</b>Three wrong guesses and the voyage ends.</div></li>
        </ul>
        <button class="btn" id="btn-start">Set Sail</button>
      </div>
    </div>
  `;
  document.getElementById("btn-start").onclick = () => { state.screen = "map"; render(); };
}

function renderMap() {
  const legsHtml = ALL_LEGS.map((leg, li) => {
    const done = state.progress[leg.id];
    const nodesHtml = leg.countries.map((c, ni) => {
      const isDone = done.has(ni);
      const isCurrent = li === firstIncompleteLeg() && ni === firstIncompleteNode(li);
      const isBoss = leg.id === "boss";
      const cls = ["pbtn"];
      if (isBoss) cls.push("boss");
      if (isDone) cls.push("done");
      else if (isCurrent) cls.push("cur");
      const locked = !isDone && !isCurrent;
      return `
        <div class="pnode-row">
          <button class="${cls.join(" ")}" data-leg="${li}" data-node="${ni}" ${locked ? "disabled" : ""}>
            ${isDone ? "✓" : (isBoss ? "👑" : ni + 1)}
          </button>
          <div class="plabel"><b>${isDone ? c.name : (isCurrent ? "???" : "Locked")}</b><span>${isBoss ? "Boss round" : leg.name}</span></div>
        </div>
      `;
    }).join("");
    return `
      <div class="leg">
        <div class="leg-h">${leg.name}</div>
        <div class="path">${nodesHtml}</div>
      </div>
    `;
  }).join("");

  const allDone = totalDone() >= totalNodes();
  $screen.innerHTML = `
    <div class="map-head">
      <h2>The Voyage</h2>
      <p class="muted">Sail leg by leg. Each correct flag restores a page of the atlas.</p>
    </div>
    ${legsHtml}
    ${allDone ? `<div class="btn-row" style="margin-top:20px"><button class="btn ok" id="btn-atlas">View Full Atlas</button></div>` : ""}
  `;
  $screen.querySelectorAll("[data-leg]").forEach((btn) => {
    if (btn.disabled) return;
    btn.onclick = () => startEncounter(Number(btn.dataset.leg), Number(btn.dataset.node));
  });
  if (allDone) document.getElementById("btn-atlas").onclick = () => { Audio2.sfxWin(); state.screen = "end"; render(); };
}

function firstIncompleteLeg() {
  for (let li = 0; li < ALL_LEGS.length; li++) {
    const leg = ALL_LEGS[li];
    if (state.progress[leg.id].size < leg.countries.length) return li;
  }
  return ALL_LEGS.length - 1;
}
function firstIncompleteNode(li) {
  const leg = ALL_LEGS[li];
  for (let ni = 0; ni < leg.countries.length; ni++) {
    if (!state.progress[leg.id].has(ni)) return ni;
  }
  return 0;
}

function startEncounter(legIndex, nodeIndex) {
  state.legIndex = legIndex;
  state.nodeIndex = nodeIndex;
  const leg = ALL_LEGS[legIndex];
  const country = leg.countries[nodeIndex];
  let distractors = shuffle(leg.countries.filter((c) => c.id !== country.id)).slice(0, 3);
  if (distractors.length < 3) {
    const extra = shuffle(pool().filter((c) => c.id !== country.id && !distractors.includes(c)));
    distractors = distractors.concat(extra.slice(0, 3 - distractors.length));
  }
  const choices = shuffle([country, ...distractors]);
  state.current = { country, choices, answered: false, picked: null };
  state.screen = "encounter";
  render();
}

function renderEncounter() {
  const { country, choices, answered, picked } = state.current;
  const choicesHtml = choices.map((c) => {
    let cls = "ch";
    if (answered) {
      if (c.id === country.id) cls += " right";
      else if (c.id === picked?.id) cls += " wrong";
    }
    return `
      <button class="${cls}" data-id="${c.id}" ${answered ? "disabled" : ""}>
        <img class="flag-img" src="https://flagcdn.com/w160/${c.code}.png" alt="${c.name} flag">
        <b>${c.name}</b>
      </button>
    `;
  }).join("");

  $screen.innerHTML = `
    <div class="enc">
      <div class="enc-head"><h2>Which flag matches?</h2></div>
      <div class="clue-card panel">
        <div class="speaker odo">
          <div class="av">🦜</div>
          <div class="bubble-txt">
            <div class="who">Odo</div>
            <p>${country.clue}</p>
          </div>
        </div>
      </div>
      <div class="choices">${choicesHtml}</div>
    </div>
  `;

  if (!answered) {
    $screen.querySelectorAll("[data-id]").forEach((btn) => {
      btn.onclick = () => { Audio2.sfxClick(); handleAnswer(btn.dataset.id); };
    });
  } else {
    renderFooter();
  }
}

function handleAnswer(id) {
  const { country, choices } = state.current;
  const picked = choices.find((c) => c.id === id);
  const correct = picked.id === country.id;
  state.current.answered = true;
  state.current.picked = picked;
  state.current.pipLine = pipLine(correct ? "correct" : "wrong");
  if (correct) {
    Audio2.sfxCorrect();
    state.ink += 10;
    if (!state.discovered.includes(country.id)) state.discovered.push(country.id);
  } else {
    Audio2.sfxWrong();
    state.hearts -= 1;
  }
  render();
  if (!correct && state.hearts <= 0) {
    setTimeout(() => { state.screen = "gameover"; render(); }, 900);
  }
}

function renderFooter() {
  const { country, picked, pipLine: pip } = state.current;
  const correct = picked.id === country.id;
  $footer.innerHTML = `
    <div class="footer ${correct ? "ok" : "bad"}">
      <div class="wrap footer-in" style="padding-block:0">
        <div class="fb">
          <h3>${correct ? "Correct!" : "Not quite — that was " + country.name}</h3>
          <p>${country.funFact}</p>
          <p class="pip-line">🧭 ${pip}</p>
        </div>
        <button class="btn ${correct ? "ok" : ""}" id="btn-continue">Continue</button>
      </div>
    </div>
  `;
  document.getElementById("btn-continue").onclick = () => {
    if (correct) {
      const leg = ALL_LEGS[state.legIndex];
      state.progress[leg.id].add(state.nodeIndex);
      state.current = null;
      openDossier(country, () => { state.screen = "map"; render(); });
    } else {
      state.current = null;
      state.screen = "map";
      render();
    }
  };
}

function openDossier(country, onClose) {
  Audio2.sfxOpen();
  $sheet.hidden = false;
  $sheet.innerHTML = `
    <div class="sheet">
      <div class="sheet-top"><button class="icon-btn" id="btn-close-sheet">✕</button></div>
      <div class="sheet-head">
        <img class="flag-huge" src="https://flagcdn.com/w160/${country.code}.png" alt="${country.name} flag">
        <div><h2>${country.name}</h2><span>${country.capital}</span></div>
      </div>
      <div class="facts">
        <div class="fact"><dt>Continent</dt><dd>${country.continent}</dd></div>
        <div class="fact"><dt>Language</dt><dd>${country.language}</dd></div>
        <div class="fact"><dt>Population</dt><dd>${country.population}</dd></div>
        <div class="fact"><dt>Capital</dt><dd>${country.capital}</dd></div>
      </div>
      <div class="funfact">✨ ${country.funFact}</div>
      <div class="odo-note">
        <div class="av">🦜</div>
        <p>${country.odoLine}</p>
      </div>
      <button class="btn ok" id="btn-sheet-continue">Continue</button>
    </div>
  `;
  const close = () => { $sheet.hidden = true; $sheet.innerHTML = ""; if (onClose) onClose(); };
  document.getElementById("btn-close-sheet").onclick = close;
  document.getElementById("btn-sheet-continue").onclick = close;
}

function renderEnd() {
  $screen.innerHTML = `
    <div class="end panel">
      <div class="big-flag">🏆</div>
      <h2>The Atlas Is Restored</h2>
      <p class="muted">You charted every leg of the voyage.</p>
      <div class="mascots-intro">
        <div class="masc odo"><div class="face">🦜</div><span>Odo is proud</span></div>
        <div class="masc pip"><div class="face">🧭</div><span>Pip is celebrating</span></div>
      </div>
      <div class="tiles">
        <div class="stat"><b>${state.discovered.length}</b><span>Countries</span></div>
        <div class="stat"><b>${state.ink}</b><span>Ink Earned</span></div>
        <div class="stat"><b>${state.hearts}</b><span>Hearts Left</span></div>
      </div>
      <div class="atlas-grid">
        ${state.discovered.map((id) => {
          const c = findCountry(id);
          return `<button class="atlas-card" data-atlas="${c.id}"><img class="flag-img" src="https://flagcdn.com/w80/${c.code}.png" alt="${c.name} flag"><b>${c.name}</b></button>`;
        }).join("")}
      </div>
      <button class="btn" id="btn-again">Sail Again</button>
    </div>
  `;
  document.getElementById("btn-again").onclick = resetGame;
  $screen.querySelectorAll("[data-atlas]").forEach((btn) => {
    btn.onclick = () => openDossier(findCountry(btn.dataset.atlas));
  });
}

function renderGameOver() {
  $screen.innerHTML = `
    <div class="end panel">
      <div class="big-flag">🌊</div>
      <h2>Lost at Sea</h2>
      <p class="muted">You discovered ${state.discovered.length} countries before the voyage ended.</p>
      <div class="tiles">
        <div class="stat"><b>${state.discovered.length}</b><span>Countries</span></div>
        <div class="stat"><b>${state.ink}</b><span>Ink Earned</span></div>
      </div>
      <button class="btn" id="btn-retry">Try Again</button>
    </div>
  `;
  document.getElementById("btn-retry").onclick = resetGame;
}

function resetGame() {
  state.screen = "title";
  state.legIndex = 0;
  state.nodeIndex = 0;
  state.hearts = 3;
  state.ink = 0;
  state.discovered = [];
  state.current = null;
  for (const leg of ALL_LEGS) state.progress[leg.id] = new Set();
  render();
}

render();
