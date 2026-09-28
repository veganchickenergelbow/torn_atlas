// Cat Utopia — pixel sprite engine: char-grid drawing primitives, a canvas
// rasterizer (grid+palette -> sprite-sheet dataURL, cached), and a CSS
// steps() animation helper. Shared by catart.js (cats), sprites.js (props),
// and wonders.js (scenes).

/* ---- grid drawing primitives: grids are arrays of arrays of single chars ---- */
function pxNewGrid(w, h, fill = ".") { return Array.from({ length: h }, () => Array(w).fill(fill)); }
function pxSet(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
function pxGet(g, x, y) { return y >= 0 && y < g.length && x >= 0 && x < g[0].length ? g[y][x] : "."; }
function pxRect(g, x0, y0, w, h, c) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pxSet(g, x, y, c); }
function pxCircle(g, cx, cy, r, c, ry = r) {
  for (let y = -ry; y <= ry; y++) for (let x = -r; x <= r; x++) {
    if ((x * x) / (r * r) + (y * y) / (ry * ry) <= 1.05) pxSet(g, cx + x, cy + y, c);
  }
}
function pxTri(g, x0, y0, x1, y1, x2, y2, c) {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.ceil(Math.max(x0, x1, x2));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.ceil(Math.max(y0, y1, y2));
  const sign = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const d1 = sign(x, y, x0, y0, x1, y1), d2 = sign(x, y, x1, y1, x2, y2), d3 = sign(x, y, x2, y2, x0, y0);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0, hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    if (!(hasNeg && hasPos)) pxSet(g, x, y, c);
  }
}
function pxLine(g, x0, y0, x1, y1, c, w = 1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  while (true) {
    for (let ow = -(w >> 1); ow < w - (w >> 1); ow++) { pxSet(g, x + ow, y, c); pxSet(g, x, y + ow, c); }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function pxRows(g) { return g.map((row) => row.join("")); }

/* ---- rasterizer: frames (array of row-arrays of grids) + palette -> canvas dataURL ---- */
const _pxSheetCache = new Map();
function pxSheet(cacheKey, frames, palette, scale) {
  const key = cacheKey + "@" + scale;
  if (_pxSheetCache.has(key)) return _pxSheetCache.get(key);
  const h = frames[0].length, w = frames[0][0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale * frames.length;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  frames.forEach((grid, fi) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === "." || !palette[c]) continue;
      ctx.fillStyle = palette[c];
      ctx.fillRect(fi * w * scale + x * scale, y * scale, scale, scale);
    }
  });
  const out = { url: canvas.toDataURL("image/png"), frameW: w * scale, frameH: h * scale, count: frames.length, w, h };
  _pxSheetCache.set(key, out);
  return out;
}
function pxClearCache() { _pxSheetCache.clear(); }

/* ---- HTML for an animated pixel sprite div (uses the shared .pixelplay keyframes in cats.css) ---- */
function pxSpriteHTML(cacheKey, frames, palette, scale, opts = {}) {
  const sheet = pxSheet(cacheKey, frames, palette, scale);
  const fps = opts.fps || 5;
  const dur = (sheet.count / fps).toFixed(2);
  // Percentage background-position resolves against (container - image) size,
  // not the image size, so it can't step a sprite sheet by whole frames — use
  // a px offset via a per-instance custom property instead (see .pixel-sprite
  // keyframes in cats.css, which read --sheet-w).
  const sheetW = sheet.frameW * sheet.count;
  const style = `width:${sheet.frameW}px;height:${sheet.frameH}px;background-image:url(${sheet.url});` +
    `--sheet-w:${sheetW}px;background-size:${sheetW}px ${sheet.frameH}px;image-rendering:pixelated;` +
    `animation:pixelplay ${dur}s steps(${sheet.count}) infinite;${sheet.count <= 1 ? "animation:none;" : ""}${opts.style || ""}`;
  return `<div class="pixel-sprite ${opts.className || ""}" style="${style}" title="${opts.title || ""}"></div>`;
}

/* ---- scale + resize helpers ---- */
function pxSceneScale(containerWidth, baseWidth, min = 2) { return Math.max(min, Math.floor(containerWidth / baseWidth)); }
function pxDebounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
