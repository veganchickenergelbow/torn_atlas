// Cat Utopia — wonder metadata + zone-scene HTML. The actual pixel art for
// each wonder's scene lives in scenes.js/scenes-wonders.js (one flattened,
// cached 160x80 canvas per wonder per time-of-day); this file just wires
// that up into a zone panel with cats + lock overlay.
const WONDERS = [
  { key: "pyramid", name: "Great Pyramid", need: 0 },
  { key: "wall", name: "Great Wall", need: 4 },
  { key: "colosseum", name: "Colosseum", need: 8 },
  { key: "machupicchu", name: "Machu Picchu", need: 12 },
  { key: "tajmahal", name: "Taj Mahal", need: 16 },
  { key: "christ", name: "Christ the Redeemer", need: 20 },
  { key: "petra", name: "Petra", need: 25 },
];
const BASE_SCENE_W = SCN_W, BASE_SCENE_H = SCN_H;

function wonderSceneHTML(w, tod, scale, unlocked, remain) {
  const sceneScale = Math.max(2, scale);
  const scn = unlocked ? renderScene(w.key, tod) : renderSceneLocked(w.key, tod);
  const sw = scn.w * sceneScale, sh = scn.h * sceneScale;
  const bgStyle = `background-image:url(${scn.url});background-size:${sw}px ${sh}px;image-rendering:pixelated;`;
  if (!unlocked) {
    const lock = lockGrid();
    return `<div class="zone locked"><div class="zone-scene" style="width:${sw}px;height:${sh}px;${bgStyle}">
      <div class="zone-lock-overlay">${pxSpriteHTML("lock", lock.frames, lock.palette, 4, {})}<p>${remain} more cat${remain === 1 ? "" : "s"}</p><span class="zone-name">${esc(w.name)}</span></div>
    </div></div>`;
  }
  return `<div class="zone" data-zone="${w.key}">
    <div class="zone-scene" style="width:${sw}px;height:${sh}px;${bgStyle}">
      <div class="zone-cats" data-cats="${w.key}"></div>
    </div>
    <div class="zone-name-tag">${esc(w.name)}</div>
  </div>`;
}
