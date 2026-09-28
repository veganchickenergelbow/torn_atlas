// Cat Utopia — the scene screen, reward reveal modal, and wonder unlocks.
// WONDERS/BASE_SCENE_* and the pixel scene layers live in wonders.js.
const ACTIVITIES = [
  { key: "napping", pose: "sleep" }, { key: "wandering", pose: "walk" },
  { key: "zooming", pose: "run" },
  { key: "chasing a butterfly", pose: "pounce" }, { key: "batting a yarn ball", pose: "pounce" },
  { key: "grooming", pose: "groom" }, { key: "snacking", pose: "eat" },
  { key: "sunbathing", pose: "stretch" }, { key: "rolling around", pose: "roll" },
  { key: "making biscuits", pose: "knead" }, { key: "people-watching", pose: "sitlook" },
  { key: "sightseeing", pose: "idle" },
];
const EMOTES = { sleep: "z", pounce: "!", knead: "♥", roll: "♥", run: "!", eat: "…", groom: "…" };
function activityForCat(cat, night) {
  if (night && Math.random() < 0.7) return ACTIVITIES.find((a) => a.pose === "sleep");
  const pose = personalityActivity(cat);
  const matches = ACTIVITIES.filter((a) => a.pose === pose);
  return matches.length ? rnd(matches) : rnd(ACTIVITIES);
}
function homeWonderKey(cc) {
  const ct = (WORLD[cc] || {}).ct;
  if (ct === "Africa") return "pyramid";
  if (ct === "Europe") return "colosseum";
  if (ct === "Asia") return catHash(cc, "zone") % 2 === 0 ? "wall" : "tajmahal";
  if (ct === "South America") return catHash(cc, "zone") % 2 === 0 ? "machupicchu" : "christ";
  if (ct === "North America") return "christ";
  return "petra";
}
function timeOfDay(hour) {
  if (hour >= 6 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "golden";
  return "night";
}

const Utopia = {
  rewardQueue: [],
  _timer: null, _resizeHandler: null, _container: null, _scale: 3,
  _catActivity: {}, _hourOverride: null,

  hour() { return this._hourOverride != null ? this._hourOverride : new Date().getHours(); },

  queueReward(reward) {
    if (!reward) return;
    this.rewardQueue.push({ type: "cat", reward });
    this.checkNewWonders();
  },
  checkNewWonders() {
    const n = Cats.cats.length;
    WONDERS.filter((w) => n >= w.need && !Cats.wondersSeen.includes(w.key)).forEach((w) => {
      Cats.markWonderSeen(w.key);
      this.rewardQueue.push({ type: "wonder", wonder: w });
    });
  },
  showNextReward(onDone) {
    if (!this.rewardQueue.length) return onDone();
    const item = this.rewardQueue.shift();
    if (item.type === "cat") this.renderCatRewardModal(item.reward, () => this.showNextReward(onDone));
    else this.renderWonderModal(item.wonder, () => this.showNextReward(onDone));
  },
  reduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; },

  renderCatRewardModal(reward, onDone) {
    const { cat, isNew, friend } = reward;
    const cc = cat.cc, nm = NM(cc);
    Audio2.sfxMeow && Audio2.sfxMeow();
    const pose = "idle";
    const pers = PERSONALITIES[catPersonality(cat)];
    const badgeCls = cat.rarity === "legendary" ? "cat-badge legendary" : cat.rarity === "rare" ? "cat-badge rare" : "cat-badge common";
    const line = rnd([`Pip is already sharing snacks with ${cat.name}.`, `Odo is telling ${cat.name} about the flag you just named.`, `Pip says ${cat.name} picked the comfiest sunbeam already.`]);
    const headline = friend && !isNew ? `${cat.name} came back for a visit!` : "A new cat joined your colony!";
    const div = document.createElement("div");
    div.className = "cat-modal-wrap" + (this.reduced() ? " reduced" : "");
    div.innerHTML = `
      <div class="cat-modal-bg"></div>
      <div class="cat-modal cat-reward">
        <div class="gift-scene">
          <div class="gift-box"><div class="gift-lid"></div><div class="gift-body">🎁</div></div>
          <div class="reward-cat pop">${catSpriteHTML(cat, pose, 5, {})}</div>
        </div>
        <h2>${esc(headline)}</h2>
        <p class="reward-name">${esc(cat.name)} of ${esc(nm)} · ${esc(pers.label)}</p>
        <p class="muted" style="margin-top:-8px">${esc(pers.blurb)}</p>
        <div class="reward-flag">${flagImg(cc, "Flag of " + nm)}</div>
        <div class="${badgeCls}">${cat.rarity}${cat.rarity !== "common" ? " · " + esc(cat.breed) : ""}</div>
        <p class="reward-fact">${esc(catBreedFact(cc))}</p>
        <p class="odo-line">${esc(line)}</p>
        <div class="btn-row">
          <button class="btn" id="rw-visit">Visit Cat Utopia</button>
          <button class="btn ghost" id="rw-keep">Keep exploring</button>
          ${Backup.shouldNudge() ? `<button class="btn ghost" id="rw-backup">Back up now</button>` : ""}
        </div>
      </div>`;
    document.body.appendChild(div);
    const close = (goUtopia) => {
      div.remove();
      if (goUtopia) { this.rewardQueue.length = 0; MQ.screen = "utopia"; mqRender(); return; }
      onDone();
    };
    div.querySelector("#rw-visit").onclick = () => close(true);
    div.querySelector("#rw-keep").onclick = () => close(false);
    const rwBackup = div.querySelector("#rw-backup");
    if (rwBackup) rwBackup.onclick = () => { div.remove(); Backup.open(); };
  },
  renderWonderModal(wonder, onDone) {
    const div = document.createElement("div");
    div.className = "cat-modal-wrap" + (this.reduced() ? " reduced" : "");
    const scn = renderScene(wonder.key, timeOfDay(this.hour()) === "night" ? "night" : "day");
    div.innerHTML = `
      <div class="cat-modal-bg"></div>
      <div class="cat-modal wonder-reward">
        <div style="width:${scn.w * 2}px;height:${scn.h * 2}px;background-image:url(${scn.url});background-size:${scn.w * 2}px ${scn.h * 2}px;image-rendering:pixelated;border-radius:8px;margin:0 auto"></div>
        <h2>Wonder unlocked: ${esc(wonder.name)}</h2>
        <p>Your cats have a new place to explore in Cat Utopia.</p>
        <div class="btn-row"><button class="btn" id="wr-ok">Nice!</button></div>
      </div>`;
    document.body.appendChild(div);
    div.querySelector("#wr-ok").onclick = () => { div.remove(); onDone(); };
  },

  assignActivities() {
    const night = timeOfDay(this.hour()) === "night";
    Cats.cats.forEach((cat) => {
      this._catActivity[cat.id] = activityForCat(cat, night);
    });
  },
  startTimers() {
    this.stopTimers();
    const tick = () => {
      if (document.hidden || MQ.screen !== "utopia") { this._timer = setTimeout(tick, 9000); return; }
      const cats = Cats.cats;
      if (cats.length) {
        const c = rnd(cats);
        this._catActivity[c.id] = activityForCat(c, timeOfDay(this.hour()) === "night");
        this.renderZones();
      }
      this._timer = setTimeout(tick, 8000 + Math.random() * 4000);
    };
    this._timer = setTimeout(tick, 8000 + Math.random() * 4000);
  },
  stopTimers() { if (this._timer) clearTimeout(this._timer); this._timer = null; },
  bindResize() {
    if (this._resizeHandler) window.removeEventListener("resize", this._resizeHandler);
    this._resizeHandler = pxDebounce(() => { if (MQ.screen === "utopia") { this.computeScale(); this.renderZones(); } }, 150);
    window.addEventListener("resize", this._resizeHandler);
  },
  computeScale() {
    const zonesEl = document.getElementById("utopia-zones");
    const w = (zonesEl && zonesEl.clientWidth) || 320;
    this._panelWidth = w;
    this._scale = pxSceneScale(w, BASE_SCENE_W, 2);
  },
  pawMeterHTML() {
    const p = Cats.progress();
    const pct = Math.min(100, (p.have / p.need) * 100);
    return `<button class="paw-meter${MQ.pawPulse ? " pulse" : ""}" id="btn-utopia-paw" title="${p.need - p.have} more correct answers until your next cat">🐾 ${p.have}/${p.need}<span class="paw-bar"><i style="width:${pct}%"></i></span></button>`;
  },
  guideLine() {
    if (Cats.lifetimeCorrect === 0) return "Welcome! Try a Europe round to get started?";
    if (Cats.cats.length > 0) {
      const next = WONDERS.find((w) => w.need > Cats.cats.length);
      return next ? `Your ${Cats.cats.length} cats are exploring Utopia — the ${next.name} unlocks at ${next.need}.` : `Your ${Cats.cats.length} cats have unlocked every wonder in Utopia!`;
    }
    const p = Cats.progress();
    return `${p.need - p.have} more correct flag${p.need - p.have === 1 ? "" : "s"} until your next cat!`;
  },
  catsForZone(key, unlockedKeys) {
    return Cats.cats.filter((c) => {
      const home = homeWonderKey(c.cc);
      return (unlockedKeys.has(home) ? home : "pyramid") === key;
    });
  },

  render(container) {
    this._container = container;
    this.assignActivities();
    const n = Cats.cats.length;
    const legendary = Cats.cats.filter((c) => c.rarity === "legendary").length;
    const wondersUnlocked = WONDERS.filter((w) => n >= w.need).length;
    container.innerHTML = `
      <div class="utopia-wrap">
        <div class="utopia-head">
          <h2>Cat Utopia</h2>
          <p class="muted">${n} cat${n === 1 ? "" : "s"} · ${wondersUnlocked}/${WONDERS.length} wonders · ${legendary} legendary</p>
          <p class="legend">🐾 Answer flags correctly in Flag Quest to adopt cats. A perfect round (5+ questions, all 3★) earns a bonus cat!</p>
          <button class="btn ghost" id="utopia-backup">Backup & restore</button>
        </div>
        ${n === 0 ? `<div class="utopia-empty panel"><div class="masc pip"><div class="face">🧭</div></div><p>Answer 3 flags correctly to adopt your first cat!</p></div>` : `<div class="utopia-zones" id="utopia-zones"></div>`}
        <div class="btn-row" style="margin-top:14px"><button class="btn ghost" id="utopia-back">Back</button></div>
        <button class="reset-link" id="utopia-reset">Reset cat colony</button>
      </div>
      <div id="cat-card-slot"></div>`;
    document.getElementById("utopia-back").onclick = () => { MQ.screen = "title"; this.stopTimers(); mqRender(); };
    document.getElementById("utopia-backup").onclick = () => Backup.open();
    document.getElementById("utopia-reset").onclick = () => {
      if (confirm("Reset your cat colony? This permanently deletes every cat you've adopted.")) { Cats.reset(); this.render(container); }
    };
    if (n > 0) { this.computeScale(); this.renderZones(); this.startTimers(); this.bindResize(); }
  },
  renderZones() {
    const zonesEl = document.getElementById("utopia-zones");
    if (!zonesEl) return;
    const n = Cats.cats.length;
    const unlockedKeys = new Set(WONDERS.filter((w) => n >= w.need).map((w) => w.key));
    const tod = timeOfDay(this.hour());
    zonesEl.innerHTML = WONDERS.map((w) => wonderSceneHTML(w, tod, this._scale, unlockedKeys.has(w.key), w.need - n)).join("");
    WONDERS.forEach((w) => {
      if (!unlockedKeys.has(w.key)) return;
      const zoneCats = this.catsForZone(w.key, unlockedKeys);
      const shown = zoneCats.slice(0, 12), overflow = zoneCats.slice(12);
      const catsEl = zonesEl.querySelector(`[data-cats="${w.key}"]`);
      if (!catsEl) return;
      catsEl.innerHTML = this.layoutCats(shown).map((c) => this.catChipHTML(c.cat, w, c.row, c.leftPct, c.patrolPx)).join("") +
        (overflow.length ? `<button class="cat-overflow" data-more="${w.key}">+${overflow.length}</button>` : "");
    });
    zonesEl.querySelectorAll("[data-cat]").forEach((el) => { el.onclick = () => this.openCatCard(el.dataset.cat, el.dataset.zone); });
    zonesEl.querySelectorAll("[data-more]").forEach((el) => { el.onclick = () => this.openOverflowList(el.dataset.more, unlockedKeys); });
  },
  // Splits the ground into N lanes (N = ceil(cats/2), at most 2 depth rows
  // per lane — front row lower/full-size, back row higher, for depth without
  // overlap) with a small jitter so cats in the same lane don't sit exactly
  // on top of each other. Walkers patrol only within their own lane.
  layoutCats(cats) {
    const lanes = Math.max(1, Math.ceil(cats.length / 2));
    const laneWidthPct = 100 / lanes;
    const laneWidthPx = (this._panelWidth || 320) / lanes;
    const patrolPx = Math.max(8, Math.min(24, Math.round(laneWidthPx * 0.28)));
    return cats.map((cat, i) => {
      const lane = Math.floor(i / 2), row = i % 2;
      const jitter = ((catHash(cat.id, "jit") % 100) / 100 - 0.5) * (laneWidthPct / 2); // +/- slot/4
      // the back row of a lane is also nudged sideways (not just up) so it
      // never sits directly behind the front cat's sprite at the bigger
      // pixel-art scale — pure vertical offset alone reads as a pile-up
      const rowOffset = row === 1 ? laneWidthPct * 0.22 : 0;
      const leftPct = Math.max(6, Math.min(94, (lane + 0.5) * laneWidthPct + jitter + rowOffset));
      return { cat, row, leftPct, patrolPx };
    });
  },
  decoHTML(key) {
    if (key === "napping") {
      const pal = { O: CAT_OUTLINE };
      return `<span class="deco-pos z z-sm">${pxSpriteHTML("propz-sm", [drawZGrid(2)], pal, 2, {})}</span>` +
        `<span class="deco-pos z z-lg">${pxSpriteHTML("propz-lg", [drawZGrid(3)], pal, 2, {})}</span>`;
    }
    if (key === "chasing a butterfly") { const p = propButterflyFrames(); return `<span class="deco-pos fly">${pxSpriteHTML("propfly", p.frames, p.palette, 2, {})}</span>`; }
    if (key === "batting a yarn ball") { const p = propYarnFrames(); return `<span class="deco-pos yarn">${pxSpriteHTML("propyarn", p.frames, p.palette, 2, {})}</span>`; }
    if (key === "snacking") { const p = propBowlFrame(); return `<span class="deco-pos bowl">${pxSpriteHTML("propbowl", p.frames, p.palette, 2, {})}</span>`; }
    if (key === "sunbathing") { const p = propSparkleFrames(); return `<span class="deco-pos glint">${pxSpriteHTML("propglint", p.frames, p.palette, 2, {})}</span>`; }
    return "";
  },
  emoteHTML(cat, act) {
    const sym = EMOTES[act.pose];
    if (!sym || catHash(cat.id, "emote") % 3 !== 0) return "";
    return `<span class="deco-pos emote">${esc(sym)}</span>`;
  },
  catChipHTML(cat, wonder, row, leftPct, patrolPx) {
    const act = this._catActivity[cat.id] || ACTIVITIES[ACTIVITIES.length - 1];
    // Depth comes from vertical position/z-index (.row-1 in cats.css), not a
    // smaller scale — every cat must render at catBasePx x sceneScale so it
    // stays readable (>=55px tall at a 900px viewport).
    const sparkle = cat.rarity === "legendary" ? (() => { const p = propSparkleFrames(); return `<span class="deco-pos sparkle">${pxSpriteHTML("propsparkle-leg", p.frames, p.palette, 2, {})}</span>`; })() : "";
    const moves = act.pose === "walk" || act.pose === "run";
    return `<button class="cat-chip row-${row} anim-${act.key.replace(/\s+/g, "-")}${moves ? " moves" : ""}" style="left:${leftPct}%;--patrol:${patrolPx || 16}px" data-cat="${cat.id}" data-zone="${wonder.key}" title="${esc(cat.name)} is ${esc(act.key)}" aria-label="${esc(cat.name)}">
      ${this.decoHTML(act.key)}${this.emoteHTML(cat, act)}${sparkle}${catSpriteHTML(cat, act.pose, this._scale, { className: "cat-chip-art" })}</button>`;
  },
  openOverflowList(zoneKey, unlockedKeys) {
    const wonder = WONDERS.find((w) => w.key === zoneKey);
    const cats = this.catsForZone(zoneKey, unlockedKeys);
    const slot = document.getElementById("cat-card-slot");
    slot.innerHTML = `<div class="cat-modal-wrap"><div class="cat-modal-bg"></div><div class="cat-modal">
      <h2>${esc(wonder.name)} — ${cats.length} cats</h2>
      <div class="cat-list">${cats.map((c) => `<button class="cat-list-row" data-cat="${c.id}">${catSpriteHTML(c, "sit", 2, {})}<span>${esc(c.name)}</span></button>`).join("")}</div>
      <div class="btn-row"><button class="btn ghost" id="ov-close">Close</button></div>
    </div></div>`;
    slot.querySelector("#ov-close").onclick = () => (slot.innerHTML = "");
    slot.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => this.openCatCard(b.dataset.cat, zoneKey)));
  },
  openCatCard(catId, zoneKey) {
    const cat = Cats.cats.find((c) => c.id === catId);
    if (!cat) return;
    const wonder = WONDERS.find((w) => w.key === zoneKey) || WONDERS[0];
    const act = this._catActivity[cat.id] || ACTIVITIES[ACTIVITIES.length - 1];
    const pers = PERSONALITIES[catPersonality(cat)];
    const slot = document.getElementById("cat-card-slot");
    const date = new Date(cat.foundAt).toLocaleDateString();
    slot.innerHTML = `<div class="cat-modal-wrap"><div class="cat-modal-bg"></div><div class="cat-modal cat-card">
      <div class="cat-card-art">${catSpriteHTML(cat, "idle", 4, {})}</div>
      <h2>${esc(cat.name)} · ${esc(pers.label)}</h2>
      <div class="reward-flag">${flagImg(cat.cc, "Flag of " + NM(cat.cc))}</div>
      <p class="cat-card-meta"><b>${esc(cat.breed)}</b> · ${cat.rarity} · Level ${cat.level}</p>
      <p class="muted">${esc(pers.blurb)} · Found ${date}</p>
      <p class="cat-card-activity">${esc(cat.name)} is ${esc(act.key)} by the ${esc(wonder.name)}.</p>
      <p class="reward-fact">${esc(catBreedFact(cat.cc))}</p>
      <div class="btn-row">
        <button class="btn" id="cc-dossier">Open ${esc(NM(cat.cc))}'s dossier</button>
        <button class="btn ghost" id="cc-close">Close</button>
      </div>
    </div></div>`;
    slot.querySelector("#cc-close").onclick = () => (slot.innerHTML = "");
    slot.querySelector("#cc-dossier").onclick = () => { slot.innerHTML = ""; showDossier(cat.cc, { keep: true }); };
  },
};
