// Cat Utopia — debug contact sheet at ?catsheet: references up top, then
// every pose for the standard ginger cat (live sprite + a static frame
// strip side by side), body-variant x tail combos, all legendaries, random
// countries and each personality's signature move, for the art QA loop.
function renderCatContactSheet(container) {
  const legendaryCC = Object.keys(LEGENDARY_STYLE);
  const sample = shuffle(LIST.filter((cc) => !legendaryCC.includes(cc))).slice(0, 12);
  const mk = (cc) => ({ id: cc + "-sheet", cc, name: catPickName(cc), breed: catBreedName(cc), rarity: catRarity(cc), level: 3 });
  const poses = Object.keys(POSES).filter((p) => p !== "sit");
  const gingerCC = LIST.find((cc) => catRarityStyle(mk(cc)).coat === "ginger") || sample[0];
  const ginger = mk(gingerCC);

  const refsHTML = `<div class="catsheet-section"><h3>References</h3><div class="catsheet-refs">
    ${[1, 2, 3, 4, 5].map((n) => `<img src="dev/refs/${n}.png" width="96" height="72" style="image-rendering:pixelated">`).join("")}
  </div></div>`;

  const frameStrip = (cat, pose) => {
    const style = catRarityStyle(cat), count = (POSE_BUILDERS[pose] || POSE_BUILDERS.idle)[1];
    let html = "";
    for (let i = 0; i < count; i++) {
      const g = catBodyFrame(pose, i, style);
      if (pose === "sleep") applySleepPattern(g, catPatternName(cat)); else applyCoatPattern(g, catPatternName(cat));
      html += pxSpriteHTML(cat.cc + "-" + pose + "-static-f" + i, [g], catPalette(cat), 3, {});
    }
    return html;
  };
  const posesHTML = `<div class="catsheet-section"><h3>Standard ginger — all animations (live, then each frame side by side)</h3><div class="catsheet-row" style="align-items:flex-start">
    ${poses.map((pose) => `<div class="catsheet-cell"><span>${pose} (${(POSE_BUILDERS[pose] || POSE_BUILDERS.idle)[1]}f)</span>
      ${catSpriteHTML(ginger, pose, 3, {})}
      <div style="display:flex;gap:2px;margin-top:4px">${frameStrip(ginger, pose)}</div></div>`).join("")}
  </div></div>`;

  const variants = ["standard", "chunky", "fluffy", "lean"], tails = ["curl", "plume", "stub", "whip"];
  const vtHTML = `<div class="catsheet-section"><h3>Body variants × tails</h3><div class="catsheet-row">
    ${variants.map((v) => tails.map((t) => {
      const c = Object.assign(mk(gingerCC), { id: gingerCC + "-" + v + "-" + t, variantOverride: v, tailOverride: t, coatOverride: "ginger" });
      return `<div class="catsheet-cell"><span>${v}/${t}</span>${catSpriteHTML(c, "idle", 3, {})}</div>`;
    }).join("")).join("")}
  </div></div>`;

  const sleepCats = ["ginger", "greyTabby", "tuxedo", "calico", "siamesePoints"].map((coat, i) => {
    const cc = sample[i] || gingerCC;
    return Object.assign(mk(cc), { id: cc + "-sleep-" + coat, variantOverride: "standard", tailOverride: "curl", coatOverride: coat });
  });
  const sleepHTML = `<div class="catsheet-section"><h3>Sleep — several coats</h3><div class="catsheet-row">
    ${sleepCats.map((c) => `<div class="catsheet-cell"><span>${c.coatOverride}</span>${catSpriteHTML(c, "sleep", 3, {})}</div>`).join("")}
  </div></div>`;

  const legCats = legendaryCC.map(mk);
  const legHTML = `<div class="catsheet-section"><h3>16 legendary breeds — idle</h3><div class="catsheet-row">
    ${legCats.map((cat) => `<div class="catsheet-cell"><span>${cat.cc} ${LEGENDARY_STYLE[cat.cc].breed}</span>${catSpriteHTML(cat, "idle", 3, {})}</div>`).join("")}
  </div></div>`;

  const sampleCats = sample.map(mk);
  const sampleHTML = `<div class="catsheet-section"><h3>12 random countries — idle</h3><div class="catsheet-row">
    ${sampleCats.map((cat) => `<div class="catsheet-cell"><span>${cat.cc}</span>${catSpriteHTML(cat, "idle", 3, {})}</div>`).join("")}
  </div></div>`;

  const persHTML = `<div class="catsheet-section"><h3>Personalities — signature activity</h3><div class="catsheet-row">
    ${PERSONALITY_KEYS.map((pk) => {
      const cc = sample.find((c) => catPersonality(mk(c)) === pk) || sampleCats[0].cc;
      const cat = mk(cc); const pose = Object.keys(PERSONALITIES[pk].weights)[0];
      return `<div class="catsheet-cell"><span>${PERSONALITIES[pk].label}: ${pose}</span>${catSpriteHTML(cat, pose, 3, {})}</div>`;
    }).join("")}
  </div></div>`;

  container.innerHTML = `<div class="catsheet">${refsHTML}${posesHTML}${sleepHTML}${vtHTML}${legHTML}${sampleHTML}${persHTML}</div>`;
}
