// Cat Utopia — hand-authored pixel cat grids, built from one master sprite
// (hand-drawn and checked against the reference photos at 6x). Every frame
// is a literal string-array grid: the master cloned with small, explicit
// pixel edits, or — for sleep/roll, which need a different silhouette — a
// fully new hand-drawn grid. No procedural shape/rect/ellipse drawing here.
// Palette letters: . transparent, O outline, B base, S shade, L light,
// E eye, N nose/blush pink, I inner ear pink, C collar, T tag.

const CAT_W = 32, CAT_H = 24;

// ---- the master (32x20, padded with 4 empty rows on top so feet sit on
// the bottom row of a 32x24 canvas). Row 4 of the original had a 1px
// disconnected outline speck in the tail hook (col5) — tidied into a clean
// 2px-thick curl per the coordinator's note; every other pixel is untouched.
const MASTER_ROWS = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "...............O........O......",
  "..OOO.........OBO......OBO.....",
  ".OLLLO........OIBOOOOOOBIO.....",
  ".OBBO........OBBBBBBBBBBBBO....",
  "..OBBO.......OBBBBBBBBBBBBO....",
  ".OBBO........OBBBEBBBBEBBBO....",
  ".OBBO........OBBNEBBBBENBBO....",
  ".OBBO........OBBBBLNNLBBBBO....",
  ".OBBO..OOOOOOOBBBBLLLLBBBBO....",
  ".OBBO.OBBBBBBBBBBBLLLLBBBO.....",
  "..OBBOBBBBBBBBBLLLLOOOOOO......",
  "..OBBBBBBBBBBBBLLLLO...........",
  "...OOOBBBBBBBBBLLLLO...........",
  ".....OBBBBBBBBBLLLLO...........",
  ".....OSSSSSSSSSLLLLO...........",
  "......OBBOSSOSSOBBO............",
  "......OBBOSSOSSOBBO............",
  "......OBBOSSOSSOBBO............",
  "......OOOOOOOOOOOOO............",
];

function padRow(r) { while (r.length < CAT_W) r += "."; return r.slice(0, CAT_W); }
function cloneMaster() { return MASTER_ROWS.map((r) => padRow(r).split("")); }
function setc(g, x, y, c) { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }
function getc(g, x, y) { return g[y] ? g[y][x] : "."; }
function rowsToStrings(g) { return g.map((r) => r.join("")); }

// landmarks (padded/absolute row & col numbers on the 32x24 canvas)
const EYE_L = 17, EYE_R = 22, EYE_ROW0 = 10, EYE_ROW1 = 11;
const NOSE_ROW = 12, NOSE_X0 = 19, NOSE_X1 = 20;
const NECK_ROW = 13, TORSO_TOP = 14, TORSO_SHADE = 19;
const LEG_ROWS = [20, 21, 22, 23];
const LEG_L = [6, 9], LEG_R = [15, 18]; // [outline-x0, outline-x1] per cluster

// Tail extraction/variants + buildBodyOnly() live in catsprites-tails.js.

/* ---- pose helpers: clone body-only, apply explicit pixel-group edits ---- */
function closeEyes(g) {
  setc(g, EYE_L - 1, EYE_ROW0, "O"); setc(g, EYE_L, EYE_ROW0, "O"); setc(g, EYE_L, EYE_ROW1, "B");
  setc(g, EYE_R, EYE_ROW0, "O"); setc(g, EYE_R + 1, EYE_ROW0, "O"); setc(g, EYE_R, EYE_ROW1, "B");
}
function happyEyes(g) {
  setc(g, EYE_L - 1, EYE_ROW1, "O"); setc(g, EYE_L, EYE_ROW0, "O"); setc(g, EYE_L, EYE_ROW1, "B");
  setc(g, EYE_R, EYE_ROW0, "O"); setc(g, EYE_R + 1, EYE_ROW1, "O"); setc(g, EYE_R, EYE_ROW1, "B");
}
function clearLegs(g) { LEG_ROWS.forEach((y) => { for (let x = 5; x <= 19; x++) setc(g, x, y, "."); }); }
// draw one leg cluster (the master's 4px OBBO block) at an x offset / row offset
function drawLegCluster(g, x0, rowShift, tone) {
  const rows = [
    ["O", "B", "B", "O"],
    ["O", "S", "S", "O"],
    ["O", "S", "S", "O"],
    ["O", "O", "O", "O"],
  ];
  for (let r = 0; r < rows.length; r++) {
    const ry = LEG_ROWS[0] + r + rowShift;
    if (ry > LEG_ROWS[LEG_ROWS.length - 1]) continue;
    for (let c = 0; c < 4; c++) {
      let ch = rows[r][c];
      if (tone === "far" && ch === "S") ch = "S"; // far legs stay shaded (already S)
      setc(g, x0 + c, ry, ch);
    }
  }
}
function legsFrame(g, nearDx, farDx, lift) {
  clearLegs(g);
  drawLegCluster(g, LEG_L[0] + farDx, lift < 0 ? 0 : 0, "far");
  drawLegCluster(g, LEG_R[0] + nearDx, 0, "near");
  if (lift > 0) { // lifted paw: shorten the near cluster by trimming its foot row
    for (let x = LEG_R[0] + nearDx; x <= LEG_R[0] + nearDx + 3; x++) setc(g, x, LEG_ROWS[3], ".");
  }
}
function addCollar(g) {
  // collar band right where the head meets the body (rule 6)
  for (let x = 14; x <= 17; x++) setc(g, x, NECK_ROW, "C");
  setc(g, 15, TORSO_TOP, "T");
  return g;
}
function withTail(g, tailName, sway) {
  stampTail(g, TAIL_GRIDS[tailName] || TAIL_GRIDS.curl, sway);
  return g;
}

function poseIdle(frame) {
  const g = buildBodyOnly();
  if (frame === 1) closeEyes(g);
  return { g, sway: frame === 2 ? 1 : 0 };
}
function poseWalk(frame) {
  const g = buildBodyOnly();
  const steps = [{ near: -1, far: 1, lift: 0, bob: 0 }, { near: 0, far: 0, lift: 1, bob: -1 },
    { near: 1, far: -1, lift: 0, bob: 0 }, { near: 0, far: 0, lift: 1, bob: -1, farLift: true }];
  const s = steps[frame % 4];
  legsFrame(g, s.near, s.far, s.lift);
  if (s.bob) shiftUp(g, s.bob);
  return { g, sway: 0 };
}
function poseRun(frame) {
  const g = buildBodyOnly();
  const steps = [{ near: 2, far: -2 }, { near: 3, far: -3 }, { near: -2, far: 2 }, { near: -3, far: 3 }];
  const s = steps[frame % 4];
  clearLegs(g);
  drawLegCluster(g, LEG_L[0] + s.far, 0, "far");
  drawLegCluster(g, LEG_R[0] + s.near, 0, "near");
  stampTail(g, TAIL_GRIDS.whip, frame % 2 ? 2 : 3); // tail streams back further
  happyEyes(g);
  return { g, sway: 0, noTail: true };
}
function shiftUp(g, dy) {
  if (!dy) return;
  if (dy < 0) { for (let i = 0; i < g.length + dy; i++) g[i] = g[i - dy] ? g[i - dy].slice() : Array(32).fill("."); }
  else { for (let i = g.length - 1; i >= dy; i--) g[i] = g[i - dy].slice(); for (let i = 0; i < dy; i++) g[i] = Array(32).fill("."); }
}
function poseStretch(frame) {
  const g = buildBodyOnly();
  clearLegs(g);
  const dip = [2, 3, 2][frame % 3];
  drawLegCluster(g, LEG_R[0], dip, "near"); // front legs pushed down/forward
  drawLegCluster(g, LEG_L[0], -1, "far"); // rear raised
  shiftUp(g, -1);
  happyEyes(g);
  return { g, sway: frame === 1 ? -1 : 0 };
}
function poseGroom(frame) {
  const g = buildBodyOnly();
  clearLegs(g);
  drawLegCluster(g, LEG_L[0], 0, "far");
  // one raised front paw near the mouth
  const liftY = [-2, -3, -2][frame % 3];
  for (let i = 0; i < 3; i++) setc(g, 20, NOSE_ROW + i + liftY, i === 0 ? "O" : "B");
  setc(g, 20, NOSE_ROW - 1 + liftY, "O");
  closeEyes(g);
  return { g, sway: 0 };
}
function poseEat(frame) {
  const g = buildBodyOnly();
  lowerHead(g, frame === 0 ? 3 : 2);
  closeEyes(g);
  return { g, sway: 0, noCollar: true };
}
// move only the head/ear/face pixel block down by dy rows, leaving the
// torso and legs in place (used for eat, where the head dips to a bowl)
function lowerHead(g, dy) {
  const rows = []; for (let y = 5; y <= 13; y++) rows.push(g[y].slice());
  for (let y = 5; y <= 13; y++) for (let x = 13; x <= 27; x++) setc(g, x, y, ".");
  rows.forEach((row, i) => { for (let x = 13; x <= 27; x++) if (row[x] !== ".") setc(g, x, 5 + i + dy, row[x]); });
}
function posePounce(frame) {
  const g = buildBodyOnly();
  clearLegs(g);
  if (frame === 0) { drawLegCluster(g, LEG_L[0], 2, "far"); drawLegCluster(g, LEG_R[0], 2, "near"); shiftUp(g, 2); }
  else if (frame === 1) { drawLegCluster(g, LEG_L[0] + 1, 2, "far"); drawLegCluster(g, LEG_R[0] - 1, 2, "near"); shiftUp(g, 2); }
  else if (frame === 2) { drawLegCluster(g, LEG_L[0] - 2, -2, "far"); drawLegCluster(g, LEG_R[0] + 3, -2, "near"); shiftUp(g, -4); happyEyes(g); }
  else { drawLegCluster(g, LEG_L[0], 0, "far"); drawLegCluster(g, LEG_R[0], 0, "near"); }
  return { g, sway: 0 };
}
function poseKnead(frame) {
  const g = buildBodyOnly();
  clearLegs(g);
  drawLegCluster(g, LEG_L[0], frame === 0 ? -1 : 1, "far");
  drawLegCluster(g, LEG_R[0], frame === 0 ? 1 : -1, "near");
  closeEyes(g);
  return { g, sway: 0 };
}
function poseSitlook(frame) {
  const g = buildBodyOnly();
  clearLegs(g);
  drawLegCluster(g, LEG_L[0], 1, "far");
  drawLegCluster(g, LEG_R[0], 0, "near");
  if (frame === 1) { shiftHead(g, 1); }
  return { g, sway: 0 };
}
// tilt the head 1px sideways by moving only the head/ear/face pixels (rows5-13, cols13-27)
function shiftHead(g, dx) {
  for (let y = 5; y <= 13; y++) {
    const row = g[y].slice();
    for (let x = 13; x <= 27; x++) setc(g, x + dx, y, row[x - dx] !== undefined ? row[x] : ".");
  }
}

/* ---- roll (sleep lives in catsprites-sleep.js) ---- */
const ROLL_MOUND = [
  [13, ".....OOBBLLLLLLLLLLLLLLLLBBOO..."],
  [14, "....OOBBLLLLLLLLLLLLLLLLLLBBOO.."],
  [15, "....OOBBLLLLLLLLLLLLLLLLLLBBOO.."],
  [16, "....OOBBLLLLLLLLLLLLLLLLLLBBOO.."],
  [17, "....OOBBLLLLLLLLLLLLLLLLLLBBOO.."],
  [18, ".....OOSSLLLLLLLLLLLLLLLLSSOO..."],
  [19, "......OOSSSSSSSSSSSSSSSSSOO....."],
];
function clearBelow(g, fromRow) { for (let y = fromRow; y < CAT_H; y++) for (let x = 0; x < CAT_W; x++) setc(g, x, y, "."); }
function stampMound(g, mound) { mound.forEach(([y, r]) => padRow(r).split("").forEach((c, x) => { if (c !== ".") setc(g, x, y, c); })); }

function poseRoll(frame) {
  const g = cloneMaster();
  clearBelow(g, 13);
  stampMound(g, ROLL_MOUND);
  happyEyes(g);
  // 4 paw nubs poking up past the belly's top edge, clear of the face
  const wig = frame === 1 ? 1 : 0;
  [[9, 11 - wig], [12, 12], [27, 12], [30, 11 - wig]].forEach(([x, y]) => { setc(g, x, y, "O"); setc(g, x, y + 1, "B"); });
  return { g, sway: 0, noTail: true, noCollar: true };
}

/* ---- pose registry: name -> [frame-builder, frame count] ---- */
const POSE_BUILDERS = {
  idle: [poseIdle, 3], walk: [poseWalk, 4], run: [poseRun, 4], stretch: [poseStretch, 3],
  groom: [poseGroom, 3], eat: [poseEat, 2], pounce: [posePounce, 4], knead: [poseKnead, 2],
  sitlook: [poseSitlook, 2], roll: [poseRoll, 3], // 'sleep' is added by catsprites-sleep.js
};
POSE_BUILDERS.sit = POSE_BUILDERS.idle; // legacy alias
const POSES = POSE_BUILDERS; // name used by utopia.js contact sheet

function catBodyFrame(poseKey, frameIdx, style) {
  const entry = POSE_BUILDERS[poseKey] || POSE_BUILDERS.idle;
  const res = entry[0](frameIdx % entry[1], style.tail || "curl");
  const g = res.g;
  if (!res.noTail) withTail(g, style.tail || "curl", (res.sway || 0) % 2);
  if (res.sleepCollar) { for (let x = 18; x <= 29; x++) if (getc(g, x, 19) === "B") setc(g, x, 19, "C"); setc(g, 20, 20, "T"); }
  else if (!res.noCollar) addCollar(g);
  if (poseKey === "sleep") return applySleepVariant(g, style.variant || "standard");
  return applyVariant(g, style.variant || "standard");
}

/* ---- body variant transforms: clean pixel ops that keep every row the same
   width (so every frame of a variant stays a rectangular grid). ---- */
function transformChunky(g) {
  return g.map((row) => { const r = row.slice(); r.splice(16, 0, row[16]); return r; });
}
function transformLean(g) {
  // duplicate one leg row for longer legs, then trim one torso column throughout
  const dupRow = g[LEG_ROWS[1]].slice();
  const g2 = g.slice(0, LEG_ROWS[1] + 1).concat([dupRow], g.slice(LEG_ROWS[1] + 1));
  return g2.map((row) => { const r = row.slice(); r.splice(16, 1); r.push("."); return r; });
}
function transformFluffy(g) {
  const out = g.map((r) => r.slice());
  [13, 6].forEach((y) => { for (let x = 8; x <= 24; x += 3) if (out[y] && out[y][x] === "." ) out[y][x] = "B"; });
  setc(out, 25, 17, "L"); setc(out, 26, 16, "L"); // chest tuft
  setc(out, 14, 5, "O"); setc(out, 23, 5, "O"); // ear tufts
  return out;
}
function applyVariant(g, variant) {
  if (variant === "chunky") return transformChunky(g);
  if (variant === "lean") return transformLean(g);
  if (variant === "fluffy") return transformFluffy(g);
  return g;
}

/* ---- coat pattern overlays: rule-based on fixed regions of the master ---- */
function applyCoatPattern(g, pattern) {
  if (!pattern || pattern === "solid") return g;
  const w = g[0].length;
  if (pattern === "tabby") {
    for (let y = 8; y <= 18; y++) for (let x = 7; x < w; x += 3) if (g[y] && g[y][x] === "B") g[y][x] = "S";
  } else if (pattern === "tuxedo") {
    for (let y = 14; y <= 19; y++) for (let x = 18; x <= 24; x++) if (g[y] && (g[y][x] === "B")) g[y][x] = "L";
    for (let x = 9; x <= 18; x++) if (g[LEG_ROWS[0]] && g[LEG_ROWS[0]][x] === "B") g[LEG_ROWS[0]][x] = "L";
  } else if (pattern === "points") {
    for (let y = 5; y <= 12; y++) for (let x = 13; x < 27; x++) if (g[y] && g[y][x] === "B") g[y][x] = "X";
    for (let x = LEG_L[0]; x <= LEG_L[1]; x++) for (const y of LEG_ROWS) if (g[y] && g[y][x] === "B") g[y][x] = "X";
    for (let x = LEG_R[0]; x <= LEG_R[1]; x++) for (const y of LEG_ROWS) if (g[y] && g[y][x] === "B") g[y][x] = "X";
  } else if (pattern === "spots") {
    [[10, 15], [12, 20], [16, 9], [17, 22], [14, 8]].forEach(([y, x]) => { if (g[y] && g[y][x] === "B") g[y][x] = "S"; });
  } else if (pattern === "calico" || pattern === "tortie") {
    for (let y = 13; y <= 15; y++) for (let x = 7; x <= 12; x++) if (g[y] && g[y][x] === "B") g[y][x] = "X";
    for (let y = 16; y <= 18; y++) for (let x = 20; x <= 24; x++) if (g[y] && g[y][x] === "B") g[y][x] = "S";
  } else if (pattern === "van") {
    for (let y = 8; y <= 19; y++) for (let x = 0; x < w; x++) if (g[y] && g[y][x] === "B" && !(x >= 13 && x <= 26 && y <= 12)) g[y][x] = "L";
  }
  return g;
}
