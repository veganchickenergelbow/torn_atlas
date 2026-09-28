// Cat Utopia — shared pixel-scene engine. One 160x80 canvas per wonder per
// time-of-day, pre-rendered and cached. Every scene shares one horizon
// (HZ=50), grounds every object on it (or on a ridge/hill surface computed
// from the same function that draws that surface), lights from the upper
// left (sun/moon at 22,13) with a cast shadow to the right, and never
// outlines scenery — only the cats get outlines. Day/golden/night are a
// palette swap only, never a different drawing.
const SCN_W = 160, SCN_H = 80, SCN_HZ = 50;

function scnHash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function scnPx(ctx, x, y, col) { if (x < 0 || y < 0 || x >= SCN_W || y >= SCN_H) return; ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, 1, 1); }

const SCN_DAY = {
  sky: ["#7EC4E6", "#94D0EC", "#ACDCF0", "#C6E7F1", "#E2F1EA"], sun: "#FFE58A", sunC: "#FFF6C8", cloud: "#FFFFFF", cloudS: "#DDEFF6",
  far: "#E9CF98", farHi: "#F3DFB2", g1: "#E6C283", g2: "#DFB46E", g3: "#D6A85E", speck: "#C8964F", speckHi: "#F0D6A0", shadow: "#C4914C",
  stoneLit: "#F3DCA2", stoneMid: "#E3C387", stoneShade: "#C99B5C", course: "#D9B777",
  trunk: "#8A5A34", trunkHi: "#A8713F", leaf: "#5DA84E", leafHi: "#7CC262", leafDk: "#3F7F38",
  farGreen: "#8FBE7A", farGreenHz: "#7CAE68", greenLit: "#7CB25E", greenMid: "#6AA04E", greenShade: "#4F853A",
  marble: "#F6F1E4", marbleShade: "#E3DACB", water: "#8FAEDB", waterHi: "#AECBEE",
  rockLit: "#E8A377", rockMid: "#D98F63", rockShade: "#B96E42", sand: "#F0C98E", sandShade: "#D9AE6E",
  seaLit: "#7EC4E6", seaMid: "#5FA6CE", seaShade: "#3E7FAE", lantern: "#FFD873",
};
const SCN_NIGHT = {
  sky: ["#141A3A", "#1A2248", "#222B57", "#2C3563", "#3A3F6A"], sun: "#E9ECFF", sunC: "#FFFFFF", cloud: "#3B4574", cloudS: "#2E3762",
  far: "#4A4466", farHi: "#5A5378", g1: "#4E4760", g2: "#473F57", g3: "#40384F", speck: "#352E43", speckHi: "#5C5470", shadow: "#2F2940",
  stoneLit: "#7A7090", stoneMid: "#655C7C", stoneShade: "#4A4262", course: "#5E5577",
  trunk: "#3A2E3A", trunkHi: "#4A3A48", leaf: "#2F4A45", leafHi: "#3D5E55", leafDk: "#233833",
  farGreen: "#37405C", farGreenHz: "#2E3652", greenLit: "#3A4A4A", greenMid: "#2F3E3E", greenShade: "#233030",
  marble: "#8A8AA0", marbleShade: "#6E6E88", water: "#2A3560", waterHi: "#38427A",
  rockLit: "#6E5468", rockMid: "#5A4456", rockShade: "#443340", sand: "#5A4E5E", sandShade: "#463C4A",
  seaLit: "#222B57", seaMid: "#1A2248", seaShade: "#141A3A", lantern: "#FFD873",
};
function scnPalette(tod) { return tod === "night" ? SCN_NIGHT : SCN_DAY; }
// Golden hour has no hand-drawn master (5 of the 7 wonders are ported
// verbatim from dev/master-wonders.js and only know day/night), so it's
// derived uniformly from the day render: the sky is repainted with the 5
// golden bands, and every ground/object pixel is mixed 28% toward #FFB070.
const SCN_GOLD_BANDS = ["#F6B27A", "#F7C58F", "#F9D8A6", "#FBE6BE", "#FCEFD2"];
function scnGolden(key) {
  const day = renderScene(key, "day");
  const c = document.createElement("canvas"); c.width = SCN_W; c.height = SCN_H;
  const ctx = c.getContext("2d");
  ctx.drawImage(day.canvas, 0, 0);
  const b = [0, 12, 24, 34, 43, SCN_HZ];
  for (let i = 0; i < 5; i++) for (let y = b[i]; y < b[i + 1]; y++) for (let x = 0; x < SCN_W; x++) {
    let col = SCN_GOLD_BANDS[i]; if (y === b[i + 1] - 1 && i < 4 && (x + y) % 2 === 0) col = SCN_GOLD_BANDS[i + 1]; scnPx(ctx, x, y, col);
  }
  const img = ctx.getImageData(0, SCN_HZ, SCN_W, SCN_H - SCN_HZ);
  const [tr, tg, tb] = hex2rgb("#FFB070"), t = 0.28;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    img.data[i] = img.data[i] * (1 - t) + tr * t;
    img.data[i + 1] = img.data[i + 1] * (1 - t) + tg * t;
    img.data[i + 2] = img.data[i + 2] * (1 - t) + tb * t;
  }
  ctx.putImageData(img, 0, SCN_HZ);
  return { url: c.toDataURL("image/png"), w: SCN_W, h: SCN_H, canvas: c };
}

/* ---- shared layers ---- */
function scnSky(ctx, P, night) {
  const bands = [0, 12, 24, 34, 43, SCN_HZ];
  for (let b = 0; b < 5; b++) for (let y = bands[b]; y < bands[b + 1]; y++) for (let x = 0; x < SCN_W; x++) {
    let col = P.sky[b]; if (y === bands[b + 1] - 1 && b < 4 && (x + y) % 2 === 0) col = P.sky[b + 1]; scnPx(ctx, x, y, col);
  }
  if (night) for (let i = 0; i < 40; i++) { const x = (scnHash(i, 7) * SCN_W) | 0, y = (scnHash(i, 9) * 40) | 0; scnPx(ctx, x, y, scnHash(i, 3) > 0.7 ? "#FFFFFF" : "#AEB6E8"); }
}
function scnSunMoon(ctx, P, night) {
  const sx = 22, sy = 13;
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
    const d = x * x + y * y; if (d > 36) continue;
    if (night && (x + 2) * (x + 2) + (y - 1) * (y - 1) <= 20) continue;
    scnPx(ctx, sx + x, sy + y, d <= 12 ? P.sunC : P.sun);
  }
}
function scnCloud(ctx, P, cx, cy, w) {
  for (let x = 0; x < w; x++) {
    const t = Math.sin((Math.PI * x) / (w - 1)); const top = Math.round(3 - 3 * t) + (x % 5 === 2 ? -1 : 0);
    for (let y = top; y <= 4; y++) scnPx(ctx, cx + x, cy + y, y === 4 ? P.cloudS : P.cloud);
  }
}
// far ridge: a silhouette layer whose bottom edge is exactly the horizon
function scnFarRidge(ctx, P, ridgeFn, lit, mid) {
  for (let x = 0; x < SCN_W; x++) { const r = Math.round(ridgeFn(x)); for (let y = r; y < SCN_HZ; y++) scnPx(ctx, x, y, y === r ? (lit || P.farHi) : (mid || P.far)); }
}
function scnGround(ctx, P, opts = {}) {
  for (let y = SCN_HZ; y < SCN_H; y++) for (let x = 0; x < SCN_W; x++) {
    let col = y < 58 ? P.g1 : y < 68 ? P.g2 : P.g3;
    if ((y === 57 || y === 67) && (x + y) % 2 === 0) col = y === 57 ? P.g2 : P.g3;
    const dens = y < 58 ? 0.006 : y < 68 ? 0.015 : 0.03; const h = scnHash(x, y);
    if (h < dens) col = P.speck; else if (h > 1 - dens * 0.6) col = P.speckHi;
    scnPx(ctx, x, y, col);
  }
  if (opts.texture) opts.texture(ctx, P);
}
/* ---- palm: still used by the pyramid; the other 6 wonders (including the
   Great Wall, now SceneKit-based like the rest) are ported wholesale from
   the masters and draw their own props inline. ---- */
function scnPalm(ctx, P, bx, by) {
  for (let x = -4; x <= 4; x++) scnPx(ctx, bx + x + 1, by + 1, P.shadow);
  for (let i = 0; i < 18; i++) { const x = bx + Math.round(Math.sin(i / 9) * 3), y = by - i; scnPx(ctx, x, y, i % 3 === 0 ? P.trunk : P.trunkHi); scnPx(ctx, x + 1, y, P.trunk); }
  const tx = bx + Math.round(Math.sin(17 / 9) * 3), ty = by - 18;
  const frond = (dx, dy, len) => { for (let k = 1; k <= len; k++) { const x = tx + Math.round(dx * k), y = ty + Math.round(dy * k + 0.08 * k * k); scnPx(ctx, x, y, P.leaf); scnPx(ctx, x, y + 1, P.leafDk); if (k < len - 1) scnPx(ctx, x, y - 1, P.leafHi); } };
  frond(1, -0.35, 8); frond(-1, -0.35, 8); frond(0.9, 0.25, 7); frond(-0.9, 0.25, 7); frond(0.3, -0.9, 4);
}

/* ---- per-wonder scenes ---- */
function scnPyramid(ctx, P, night) {
  scnSky(ctx, P, night);
  scnSunMoon(ctx, P, night);
  scnCloud(ctx, P, 58, 10, 18); scnCloud(ctx, P, 112, 18, 13);
  scnFarRidge(ctx, P, (x) => SCN_HZ - 4 - 2.2 * Math.sin(x / 17) - 1.6 * Math.sin(x / 7.3 + 1));
  scnGround(ctx, P);
  for (let i = 0; i < 14; i++) { const x = (scnHash(i, 21) * 150) | 0, y = 62 + ((scnHash(i, 22) * 16) | 0), w = 3 + ((scnHash(i, 23) * 4) | 0); for (let k = 0; k < w; k++) scnPx(ctx, x + k, y, P.speckHi); }
  const pyramid = (cx, baseY, h) => {
    const apex = baseY - h;
    for (let y = baseY - 1; y <= baseY + 1; y++) for (let x = cx + Math.round((y - apex) * 1.05) - 1; x <= cx + Math.round(h * 1.05) + Math.round(h * 0.45) - (y - baseY + 1) * 3; x++) scnPx(ctx, x, y, P.shadow);
    for (let y = apex; y <= baseY; y++) { const hw = Math.round((y - apex) * 1.05); for (let x = cx - hw; x <= cx + hw; x++) { let col = x < cx ? P.stoneLit : x === cx ? P.stoneMid : P.stoneShade; if (x < cx && (y - apex) % 3 === 0 && y > apex + 1) col = P.course; if (x < cx && x === cx - hw) col = P.stoneMid; scnPx(ctx, x, y, col); } }
  };
  pyramid(52, 54, 17); pyramid(98, 58, 33);
  scnPalm(ctx, P, 22, 64);
  for (let i = 0; i < 10; i++) { const x = (scnHash(i, 31) * 156) | 0, y = 70 + ((scnHash(i, 32) * 8) | 0); scnPx(ctx, x, y, P.speck); scnPx(ctx, x + 1, y, P.speck); scnPx(ctx, x, y - 1, P.speckHi); }
}

const SCENE_DRAWERS = { pyramid: scnPyramid };
function registerScene(key, fn) { SCENE_DRAWERS[key] = fn; }

/* ---- cache + public API ---- */
const _scnCache = new Map();
function renderScene(key, tod) {
  const cacheKey = key + "@" + tod;
  if (_scnCache.has(cacheKey)) return _scnCache.get(cacheKey);
  let out;
  if (tod === "golden") {
    out = scnGolden(key);
  } else {
    const c = document.createElement("canvas"); c.width = SCN_W; c.height = SCN_H;
    const ctx = c.getContext("2d");
    const draw = SCENE_DRAWERS[key] || scnPyramid;
    draw(ctx, scnPalette(tod), tod === "night");
    out = { url: c.toDataURL("image/png"), w: SCN_W, h: SCN_H, canvas: c };
  }
  _scnCache.set(cacheKey, out);
  return out;
}
function renderSceneLocked(key, tod, wonderSilhouette) {
  const cacheKey = key + "@" + tod + "@locked";
  if (_scnCache.has(cacheKey)) return _scnCache.get(cacheKey);
  const base = renderScene(key, tod === "night" ? "night" : "day");
  const c = document.createElement("canvas"); c.width = SCN_W; c.height = SCN_H;
  const ctx = c.getContext("2d");
  ctx.filter = "grayscale(1) brightness(.55)";
  ctx.drawImage(base.canvas, 0, 0);
  ctx.filter = "none";
  const url = c.toDataURL("image/png");
  const out = { url, w: SCN_W, h: SCN_H, canvas: c };
  _scnCache.set(cacheKey, out);
  return out;
}
