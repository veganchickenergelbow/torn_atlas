// Cat Utopia — the sleep pose. A second hand-drawn master (see
// dev/master-sleep.js, checked against the user's sleeping-cat references
// at 6x): a curled loaf, head on the right, tail wrapped along the front.
// Frames are edits of THIS master only (raise the back arc for breathing,
// twitch the far ear) — it is not derived from the standing master, and
// this file is loaded after catsprites.js/catart.js so it can plug into
// their pose/pattern/variant registries.
const MASTER_SLEEP = [
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "...................O........O...",
  "..................OBO......OBO..",
  "..................OIBOOOOOOBIO..",
  ".............OOOOOBBBBBBBBBBBBO.",
  ".........OOOOBBBBOBBBBBBBBBBBBO.",
  "......OOOBBBBBBBBOBBOOBBBBOOBBO.",
  "....OOBBBBBBBBBBBOBBNBBBBBBNBBO.",
  "...OBBBBBBBBBBBBBOBBBBLNNLBBBBO.",
  "...OBBBBBBBBBBBBBOBBBBLLLLBBBBO.",
  "..OSSSSSSSSSSSSSSOBBBBBBBBBBBBO.",
  "..OBBOOOOOOOOOOOOOBBBBBBBBBBBBO.",
  "..OSOBBBBBBBBBBBLOLLLOSSSOLLLO..",
  "..OSOSSSSSSSSSSSOOOOOOOOOOOOO...",
  "...OOOOOOOOOOOOOO...............",
  "................................",
];
// z particle, drawn in outline colour: size 2 (small) or 3 (big)
function drawZGrid(size) {
  const g = pxNewGrid(size + 2, size + 2);
  for (let i = 0; i <= size; i++) { setc(g, i, 0, "O"); setc(g, i, size, "O"); setc(g, size - i, i, "O"); }
  return g;
}

function poseSleep(frame, tailName) {
  const g = MASTER_SLEEP.map((r) => padRow(r).split(""));
  if (frame === 1) {
    // breathing: raise the back's top-outline arc (cols3-16, rows12-18) up
    // one row and fill the gap with B; head, tail and paws stay put
    for (let x = 3; x <= 16; x++) {
      for (let y = 12; y <= 18; y++) setc(g, x, y - 1, getc(g, x, y));
      setc(g, x, 18, "B");
    }
  } else if (frame === 2) {
    setc(g, 28, 9, "."); setc(g, 28, 10, "O"); setc(g, 29, 10, "B"); // far ear twitch 1px
  }
  adjustSleepTail(g, tailName);
  return { g, sway: 0, noTail: true, noCollar: true, sleepCollar: true };
}
// stub cats hide the front tail band (rows19-22) behind a closed, tail-less
// silhouette; plume/whip just thicken that band by a row. curl (default) is
// the master's own tail, untouched.
function adjustSleepTail(g, tailName) {
  if (tailName === "stub") {
    for (let y = 19; y <= 22; y++) for (let x = 2; x <= 17; x++) {
      const c = getc(g, x, y);
      setc(g, x, y, c === "." ? "." : y === 22 ? "O" : x <= 2 || x >= 16 ? "O" : "S");
    }
  } else if (tailName === "plume" || tailName === "whip") {
    for (let x = 3; x <= 16; x++) setc(g, x, 22, getc(g, x, 21) === "." ? "." : "S");
    setc(g, 2, 22, "O"); setc(g, 17, 22, "O");
  }
}
// sleep-pose body variants, on the sleep master's own layout
function applySleepVariant(g, variant) {
  if (variant === "chunky") return g.map((row) => { const r = row.slice(); r.splice(9, 0, row[9]); return r; });
  if (variant === "fluffy") {
    const out = g.map((r) => r.slice());
    for (let x = 4; x <= 16; x += 3) if (getc(out, x, 12) === ".") setc(out, x, 12, "B");
    return out;
  }
  return g; // lean: same as standard for sleep
}
// coat pattern overlay for the sleep master's own geometry (back arc at
// cols3-17/rows12-18, head at cols18-29) — same rules as the standing cat,
// remapped onto this pose's layout.
function applySleepPattern(g, pattern) {
  if (!pattern || pattern === "solid") return g;
  if (pattern === "tabby") {
    for (let y = 12; y <= 18; y++) for (let x = 3; x <= 17; x += 3) if (getc(g, x, y) === "B") setc(g, x, y, "S");
  } else if (pattern === "points") {
    for (let y = 9; y <= 19; y++) for (let x = 18; x <= 30; x++) if (getc(g, x, y) === "B") setc(g, x, y, "X");
  } else if (pattern === "tuxedo") {
    for (let y = 16; y <= 19; y++) for (let x = 22; x <= 29; x++) if (getc(g, x, y) === "B") setc(g, x, y, "L");
  } else if (pattern === "spots") {
    [[14, 6], [16, 10], [13, 12], [17, 15]].forEach(([y, x]) => { if (getc(g, x, y) === "B") setc(g, x, y, "S"); });
  } else if (pattern === "calico" || pattern === "tortie") {
    for (let y = 12; y <= 15; y++) for (let x = 4; x <= 9; x++) if (getc(g, x, y) === "B") setc(g, x, y, "X");
  } else if (pattern === "van") {
    for (let y = 12; y <= 19; y++) for (let x = 0; x < CAT_W; x++) if (getc(g, x, y) === "B" && !(x >= 18 && x <= 29 && y <= 15)) setc(g, x, y, "L");
  }
  return g;
}
POSE_BUILDERS.sleep = [poseSleep, 3];
