// Cat Utopia — the standing master's tail, pulled out into its own small
// grid so tail variants (curl/plume/stub/whip) combine freely with any
// body. Tail lives at cols0-6, rows5-15 (orig rows1-11) of the master;
// buildBodyOnly() blanks those cells so body + tail recombine independently.
const TAIL_OX = 0, TAIL_OY = 5, TAIL_W = 7, TAIL_H = 11;
const TAIL_CELLS = [
  [1, [2, "O"], [3, "O"], [4, "O"]],
  [2, [1, "O"], [2, "L"], [3, "L"], [4, "L"], [5, "O"]],
  [3, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [4, [2, "O"], [3, "B"], [4, "B"], [5, "O"]],
  [5, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [6, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [7, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [8, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [9, [1, "O"], [2, "B"], [3, "B"], [4, "O"]],
  [10, [2, "O"], [3, "B"], [4, "B"], [5, "O"]],
];
function buildBodyOnly() {
  const g = cloneMaster();
  TAIL_CELLS.forEach(([ry, ...cells]) => cells.forEach(([cx]) => setc(g, cx, TAIL_OY + ry, ".")));
  return g;
}
function tailGridBlank() { return Array.from({ length: TAIL_H }, () => Array(TAIL_W).fill(".")); }
function stampTail(g, tailGrid, sway = 0) {
  for (let y = 0; y < TAIL_H; y++) for (let x = 0; x < TAIL_W; x++) {
    const c = tailGrid[y][x]; if (c === ".") continue;
    // only the top 5 rows (the curl/flourish) sway; the base stays anchored
    const dx = y < 5 ? sway : 0;
    setc(g, TAIL_OX + x + dx, TAIL_OY + y, c);
  }
}
function tailCurlGrid() {
  const g = tailGridBlank();
  TAIL_CELLS.forEach(([ry, ...cells]) => cells.forEach(([cx, c]) => (g[ry][cx] = c)));
  return g;
}
function tailPlumeGrid() {
  const g = tailCurlGrid();
  [[1, 5, "B"], [2, 6, "B"], [4, 5, "B"], [6, 5, "B"], [8, 5, "B"]].forEach(([y, x, c]) => (g[y][x] = c));
  return g;
}
function tailStubGrid() {
  const g = tailGridBlank();
  g[9] = [".", ".", "O", "B", "B", "O", "."];
  g[10] = [".", ".", "O", "O", "O", "O", "."];
  return g;
}
function tailWhipGrid() {
  const g = tailGridBlank();
  g[10] = [".", ".", "O", "B", "B", "O", "."];
  g[9] = [".", ".", "O", "B", "O", ".", "."];
  g[8] = [".", "O", "B", "O", ".", ".", "."];
  g[7] = [".", "O", "B", "O", ".", ".", "."];
  g[6] = ["O", "B", "O", ".", ".", ".", "."];
  g[5] = ["O", "B", ".", ".", ".", ".", "."];
  g[4] = ["O", "B", ".", ".", ".", ".", "."];
  g[3] = ["O", ".", ".", ".", ".", ".", "."];
  return g;
}
const TAIL_GRIDS = { curl: tailCurlGrid(), plume: tailPlumeGrid(), stub: tailStubGrid(), whip: tailWhipGrid() };
