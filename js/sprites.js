// Cat Utopia — color helpers + small prop pixel sprites (butterfly, yarn
// ball, fish bowl, "z" particle). Cat and wonder grids live in catart.js /
// wonders.js; this file holds shared bits that don't need to live there.

function catHash(s, salt = "") {
  let h = 5381;
  const str = s + "|" + salt;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}
function hex2rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgb2hex([r, g, b]) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function shade(hex, pct) { const [r, g, b] = hex2rgb(hex); return rgb2hex([r * (1 + pct), g * (1 + pct), b * (1 + pct)]); }
function mix(hexA, hexB, t) { const a = hex2rgb(hexA), b = hex2rgb(hexB); return rgb2hex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }

// Flag color name -> pastel base tone used for procedural cat coats.
const FLAG_PASTEL = {
  red: "#F2957E", green: "#9BCB84", white: "#F5EFE2", yellow: "#F2CE7E",
  blue: "#8FAEDB", lightblue: "#AED4EC", black: "#8C7B6E", orange: "#F0AE74",
};
const OUTLINE = "#4A3426";

function propButterflyFrames() {
  const f1 = pxNewGrid(8, 6), f2 = pxNewGrid(8, 6);
  pxRect(f1, 3, 2, 2, 2, "b"); pxCircle(f1, 1, 2, 2, "w", 2); pxCircle(f1, 6, 2, 2, "w", 2);
  pxCircle(f2, 1, 3, 1, "w", 1); pxCircle(f2, 6, 3, 1, "w", 1); pxRect(f2, 3, 2, 2, 2, "b");
  return { frames: [f1, f2], palette: { b: OUTLINE, w: "#F2957E" } };
}
function propYarnFrames() {
  const f1 = pxNewGrid(8, 8), f2 = pxNewGrid(8, 8);
  pxCircle(f1, 4, 4, 3, "y"); pxLine(f1, 1, 4, 7, 4, "o"); pxLine(f1, 4, 1, 4, 7, "o");
  pxCircle(f2, 4, 4, 3, "y"); pxLine(f2, 2, 2, 6, 6, "o"); pxLine(f2, 6, 2, 2, 6, "o");
  return { frames: [f1, f2], palette: { y: "#F2CE7E", o: "#C99A56" } };
}
function propBowlFrame() {
  const g = pxNewGrid(10, 6);
  pxRect(g, 1, 3, 8, 3, "w"); pxRect(g, 2, 2, 6, 1, "f");
  return { frames: [g], palette: { w: "#AED4EC", f: "#F2957E" } };
}
function propZFrames() {
  const f1 = pxNewGrid(6, 6), f2 = pxNewGrid(6, 6);
  pxSet(f1, 1, 1, "z"); pxSet(f1, 2, 1, "z"); pxSet(f1, 3, 1, "z"); pxSet(f1, 3, 2, "z"); pxSet(f1, 2, 3, "z"); pxSet(f1, 1, 3, "z"); pxSet(f1, 1, 4, "z");
  f2.forEach((r, y) => f1[y] && r.forEach((_, x) => (f2[y][x] = f1[y][x])));
  return { frames: [f1, f2], palette: { z: "#F2CE7E" } };
}
function propSparkleFrames() {
  const f1 = pxNewGrid(6, 6), f2 = pxNewGrid(6, 6);
  pxSet(f1, 3, 1, "g"); pxSet(f1, 3, 5, "g"); pxSet(f1, 1, 3, "g"); pxSet(f1, 5, 3, "g"); pxSet(f1, 3, 3, "g");
  pxSet(f2, 3, 3, "g");
  return { frames: [f1, f2], palette: { g: "#F2CE7E" } };
}

// Wonder background art now lives in scenes.js/scenes-wonders.js as one
// pre-rendered raster scene per wonder/time-of-day (see wonderSceneHTML in
// wonders.js). Only the reward-modal lock icon stays here as a pixel grid.
function lockGrid() {
  const g = pxNewGrid(12, 12);
  pxRect(g, 3, 2, 6, 5, "o", 0); pxTri(g, 3, 5, 5, 1, 9, 5, ".");
  pxCircle(g, 6, 3, 3, ".", 3); pxCircle(g, 6, 3, 2, "o", 2);
  pxRect(g, 2, 5, 8, 6, "o"); pxRect(g, 5, 7, 2, 3, "d");
  return { frames: [g], palette: { o: "#F2CE7E", d: "#4A3826" } };
}
