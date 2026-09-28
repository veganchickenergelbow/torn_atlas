// Cat Utopia — Colosseum/Machu Picchu/Taj Mahal/Christ/Petra, ported
// pixel-for-pixel from dev/master-wonders.js (hand-drawn masters). Do not
// redesign, move, or "improve" any shape here — only the registration
// plumbing at the bottom adapts them to the shared scene-engine cache.
function SceneKit(night) {
  const W = 160, H = 80, HZ = 50; const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const px = (x, y, col) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const SKY = night ? ["#141A3A", "#1A2248", "#222B57", "#2C3563", "#3A3F6A"] : ["#7EC4E6", "#94D0EC", "#ACDCF0", "#C6E7F1", "#E2F1EA"];
  const sky = () => { const b = [0, 12, 24, 34, 43, HZ]; for (let i = 0; i < 5; i++) for (let y = b[i]; y < b[i + 1]; y++) for (let x = 0; x < W; x++) { let col = SKY[i]; if (y === b[i + 1] - 1 && i < 4 && (x + y) % 2 === 0) col = SKY[i + 1]; px(x, y, col); } if (night) for (let i = 0; i < 40; i++) px(hash(i, 7) * W, hash(i, 9) * 40, hash(i, 3) > 0.7 ? "#FFF" : "#AEB6E8"); const sx = 22, sy = 13; for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const d = x * x + y * y; if (d <= 36) { if (night && (x + 2) * (x + 2) + (y - 1) * (y - 1) <= 20) continue; px(sx + x, sy + y, night ? (d <= 12 ? "#FFF" : "#E9ECFF") : (d <= 12 ? "#FFF6C8" : "#FFE58A")); } } };
  const cloud = (cx, cy, w) => { const a = night ? "#3B4574" : "#FFFFFF", b = night ? "#2E3762" : "#DDEFF6"; for (let x = 0; x < w; x++) { const t = Math.sin(Math.PI * x / (w - 1)); const top = Math.round(3 - 3 * t) + (x % 5 === 2 ? -1 : 0); for (let y = top; y <= 4; y++) px(cx + x, cy + y, y === 4 ? b : a); } };
  const ground = (G, accent) => { for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) { let col = y < 58 ? G.g1 : y < 68 ? G.g2 : G.g3; if ((y === 57 || y === 67) && (x + y) % 2 === 0) col = y === 57 ? G.g2 : G.g3; const d = y < 58 ? 0.006 : y < 68 ? 0.015 : 0.03, h = hash(x, y); if (h < d) col = G.speck; else if (h > 1 - d * 0.6) col = G.speckHi; px(x, y, col); } if (accent) accent(); };
  const N = (day, nt) => night ? nt : day;
  return { W, H, HZ, c, g, px, hash, sky, cloud, ground, N, night };
}
function grass(K) { return { g1: K.N("#A9C77A", "#3E4E3E"), g2: K.N("#96BA66", "#374735"), g3: K.N("#86AC58", "#303F2F"), speck: K.N("#6F9446", "#2A3628"), speckHi: K.N("#C3DB94", "#4E614B") }; }
function plantShadow(K, bx, by, w) { for (let x = -w; x <= w; x++) K.px(bx + x + 1, by + 1, K.N("#6F9446", "#2A3628")); }

// ---------- COLOSSEUM
function sceneColosseum(night) { const K = SceneKit(night), { px, HZ, N } = K;
  K.sky(); K.cloud(70, 9, 18); K.cloud(120, 20, 12);
  for (let x = 0; x < 160; x++) { const blk = Math.floor(x / 9), top = HZ - 3 - ((K.hash(blk, 5) * 4) | 0) - (((x % 9) === 4) ? 1 : 0); for (let y = top; y < HZ; y++) px(x, y, y === top ? N("#D9A58A", "#5A4460") : N("#E4BCA2", "#4E3E58")); }
  K.ground(grass(K), () => { for (let y = HZ + 1; y < 58; y++) for (let x = 40; x < 130; x++) { const cob = ((x + (y % 2) * 2) % 4 === 0) || (y % 3 === 0); px(x, y, cob ? N("#BFB29C", "#4A4458") : N("#D8CCB4", "#5A5468")); } });
  const L = 44, R = 124, base = 56, T = [{ top: base - 9 }, { top: base - 17 }, { top: base - 24 }];
  const lit = N("#EADCC0", "#8A8098"), mid = N("#D7C4A2", "#6E6682"), shd = N("#B9A47F", "#565070"), hole = N("#5B4A3A", "#26213A"), glow = "#FFC766";
  for (let y = base - 1; y <= base + 1; y++) for (let x = R - 4; x <= R + 12 - (y - base + 1) * 3; x++) px(x, y, N("#7E9E52", "#2A3628"));
  T.forEach((t, i) => { const ruinX = i === 0 ? R : i === 1 ? R - 14 : R - 30;
    for (let y = t.top; y < base - (i === 0 ? 0 : (i === 1 ? 9 : 17)); y++) for (let x = L + i * 2; x <= ruinX; x++) {
      const rel = x - (L + i * 2), col = rel % 6; let c = y === t.top ? lit : col === 0 ? lit : col === 5 ? shd : mid;
      const archTop = t.top + 3; if (col >= 2 && col <= 4 && y >= archTop && !(y === archTop && (col === 2 || col === 4))) c = (night && i === 0 && (rel / 6 | 0) % 3 === 1) ? glow : hole;
      px(x, y, c); }
    for (let x = L + i * 2; x <= ruinX; x++) px(x, t.top, lit);
    for (let k = 0; k < 4; k++) px(ruinX - k, t.top - 1 + (k % 2), mid);
  });
  const cyp = (bx, by, h) => { for (let x = -3; x <= 3; x++) px(bx + x + 1, by + 1, N("#6F9446", "#2A3628")); for (let y = 0; y < h; y++) { const w = Math.max(1, Math.round(2.6 * Math.sin(Math.PI * (y + 1) / (h + 1)))); for (let x = -w; x <= w; x++) px(bx + x, by - y, x < 0 ? N("#4E8A45", "#2B4A3A") : N("#3C6E37", "#213A2F")); } px(bx, by + 1, N("#6B4A2E", "#3A2E3A")); };
  cyp(28, 60, 20); cyp(138, 62, 22); cyp(146, 59, 15);
  return K.c; }

// ---------- MACHU PICCHU
function sceneMachu(night) { const K = SceneKit(night), { px, HZ, N } = K; K.sky(); K.cloud(24, 24, 14); K.cloud(118, 8, 16);
  const pk = (cx, top, hw) => { for (let y = top; y < HZ; y++) { const t = (y - top) / (HZ - top); const w = Math.round(hw * Math.pow(t, 0.7)); for (let x = cx - w; x <= cx + w; x++) { let c = x < cx - 1 ? N("#6FA55A", "#2E4A3A") : N("#4F8A45", "#233A30"); if (K.hash(x, y) < 0.06) c = N("#8FBF72", "#3B5A48"); px(x, y, c); } } };
  pk(112, 8, 26); pk(140, 22, 18);
  for (let y = HZ - 5; y < HZ - 2; y++) for (let x = 80; x < 160; x++) if ((x + y) % 2 === 0) px(x, y, N("#E8F2EE", "#3E4870"));
  K.ground(grass(K));
  const steps = 5, x0 = 18, x1 = 100;
  for (let s = 0; s < steps; s++) { const top = 57 - s * 4, left = x0 + s * 7, right = x1 - s * 5;
    for (let x = left; x <= right; x++) { px(x, top, N("#A7CC73", "#3F5A42")); px(x, top + 1, N("#8DB65E", "#34503A")); px(x, top + 2, x % 4 === 0 ? N("#8E8574", "#3E3A4C") : N("#B7AD98", "#524C62")); px(x, top + 3, N("#9C927E", "#45404F")); }
    for (let y = top; y < top + 4; y++) px(right + 1, y, N("#7C735F", "#35313F"));
  }
  const hut = (hx, shelfY) => { for (let y = shelfY - 6; y < shelfY; y++) for (let x = hx; x < hx + 8; x++) px(x, y, x < hx + 2 ? N("#D2C8B2", "#6E6880") : N("#B8AD95", "#58526A"));
    for (let k = 0; k < 4; k++) for (let x = hx + k; x < hx + 8 - k; x++) px(x, shelfY - 7 - k, k === 3 ? N("#9C927E", "#45404F") : N("#C8BEA6", "#625C74"));
    px(hx + 3, shelfY - 3, night ? "#FFC766" : N("#5B4A3A", "#26213A")); px(hx + 4, shelfY - 3, night ? "#FFC766" : N("#5B4A3A", "#26213A")); };
  hut(48, 41); hut(62, 41); hut(56, 37);
  const lx = 128, ly = 66; plantShadow(K, lx + 2, ly, 5);
  const W_ = N("#F3ECDD", "#8C8698"), Sd = N("#D8CDB6", "#6C667C"), Dk = N("#5B4A3A", "#26213A");
  for (let x = 0; x < 7; x++) for (let y = 0; y < 4; y++) px(lx + x, ly - 6 + y, y === 3 ? Sd : W_);
  for (let y = 0; y < 7; y++) { px(lx + 6, ly - 12 + y, W_); px(lx + 7, ly - 12 + y, Sd); }
  px(lx + 8, ly - 12, W_); px(lx + 9, ly - 12, Sd); px(lx + 6, ly - 13, W_); px(lx + 7, ly - 14, Sd);
  px(lx + 8, ly - 11, Dk);
  [0, 2, 4, 6].forEach((k) => { px(lx + k, ly - 2, Sd); px(lx + k, ly - 1, Sd); px(lx + k, ly, Dk); });
  return K.c; }

// ---------- TAJ MAHAL
function sceneTaj(night) { const K = SceneKit(night), { px, HZ, N } = K; K.sky(); K.cloud(46, 9, 16); K.cloud(118, 17, 12);
  for (let x = 0; x < 160; x++) { const top = HZ - 3 - Math.round(1.5 + 1.5 * Math.sin(x / 3.1) + Math.sin(x / 7)); for (let y = top; y < HZ; y++) px(x, y, N("#9CBF8A", "#344438")); }
  K.ground({ g1: N("#B6D28A", "#3E4E3E"), g2: N("#A3C675", "#374735"), g3: N("#93B866", "#303F2F"), speck: N("#7DA153", "#2A3628"), speckHi: N("#CFE3A6", "#4E614B") });
  const cx = 80, base = 54, M = N("#FBF7F0", "#9A96B0"), Ms = N("#E6DED0", "#7A7690"), Mt = N("#CFC4B2", "#625E78"), Dk = N("#8E7F6A", "#3A3650");
  for (let y = base; y < base + 3; y++) for (let x = cx - 34; x <= cx + 34; x++) px(x, y, y === base ? M : Ms);
  for (let y = base - 14; y < base; y++) for (let x = cx - 14; x <= cx + 14; x++) px(x, y, x < cx ? M : Ms);
  for (let y = base - 11; y < base; y++) for (let x = cx - 3; x <= cx + 3; x++) if (!(y === base - 11 && Math.abs(x - cx) === 3)) px(x, y, night && y > base - 6 ? "#FFC766" : Dk);
  [cx - 10, cx + 8].forEach((ax) => { for (let y = base - 9; y < base - 2; y++) for (let x = ax; x < ax + 3; x++) px(x, y, night ? "#E8B85A" : Mt); });
  for (let y = base - 18; y < base - 14; y++) for (let x = cx - 7; x <= cx + 7; x++) px(x, y, x < cx ? M : Ms);
  for (let y = 0; y < 12; y++) { const r = [5, 8, 9, 10, 10, 10, 9, 9, 8, 6, 4, 2][y]; for (let x = cx - r; x <= cx + r; x++) px(x, base - 29 + y, x < cx - 2 ? M : (x < cx + 3 ? Ms : Mt)); }
  px(cx, base - 31, Mt); px(cx, base - 32, N("#D8B25A", "#8A7A50")); px(cx, base - 33, N("#D8B25A", "#8A7A50"));
  [cx - 12, cx + 12].forEach((dx) => { for (let y = 0; y < 3; y++) { const r = [1, 2, 2][y]; for (let x = dx - r; x <= dx + r; x++) px(x, base - 17 + y, x < dx ? M : Ms); } });
  [cx - 32, cx - 24, cx + 24, cx + 32].forEach((mx, i) => { const h = i % 3 === 0 ? 26 : 22; for (let y = base - h; y < base; y++) { px(mx, y, M); px(mx + 1, y, Ms); } for (let x = mx - 1; x <= mx + 2; x++) { px(x, base - h, Mt); px(x, base - h + 8, Mt); } px(mx, base - h - 1, Ms); px(mx + 1, base - h - 1, Mt); px(mx, base - h - 2, Mt); });
  const P1 = N("#7FC0E0", "#28325C"), P2 = N("#9FD2EA", "#323E6A");
  for (let y = 60; y < 72; y++) for (let x = cx - 8; x <= cx + 8; x++) px(x, y, (y % 3 === 0 && x % 2 === 0) ? P2 : P1);
  for (let y = 0; y < 8; y++) { const r = [8, 7, 6, 5, 4, 3, 2, 1][y]; for (let x = cx - Math.min(r, 6); x <= cx + Math.min(r, 6); x++) if ((x + y) % 2 === 0) px(x, 61 + y, N("#C6E2EE", "#4A5480")); }
  for (let x = cx - 9; x <= cx + 9; x++) { px(x, 59, Mt); px(x, 72, Mt); } for (let y = 59; y <= 72; y++) { px(cx - 9, y, Mt); px(cx + 9, y, Mt); }
  const cyp = (bx, by, h) => { plantShadow(K, bx, by, 2); for (let y = 0; y < h; y++) { const w = Math.max(1, Math.round(1.8 * Math.sin(Math.PI * (y + 1) / (h + 1)))); for (let x = -w; x <= w; x++) px(bx + x, by - y, x < 0 ? N("#4E8A45", "#2B4A3A") : N("#3C6E37", "#213A2F")); } };
  [62, 66, 70].forEach((y, i) => { cyp(cx - 16 - i * 3, y, 9 + i); cyp(cx + 16 + i * 3, y, 9 + i); });
  return K.c; }

// ---------- CHRIST THE REDEEMER
function sceneChrist(night) { const K = SceneKit(night), { px, HZ, N } = K; K.sky(); K.cloud(40, 20, 14); K.cloud(86, 8, 18);
  for (let y = 44; y < HZ; y++) for (let x = 0; x < 160; x++) px(x, y, (y === 46 && (x % 7 < 3)) ? N("#CFEAF3", "#4A5890") : N("#5FA8D0", "#22305C"));
  for (let y = 26; y < HZ; y++) { const t = (y - 26) / (HZ - 26); const w = Math.round(9 * Math.sqrt(t) + 1); for (let x = 28 - w; x <= 28 + w; x++) px(x, y, x < 27 ? N("#7DA06A", "#344A40") : N("#5E8552", "#26382F")); }
  K.ground(grass(K));
  const hill = (x) => Math.round(22 + 0.012 * Math.pow(x - 126, 2));
  for (let x = 60; x < 160; x++) { const top = Math.max(hill(x), 22); if (top >= HZ + 6) continue; for (let y = top; y < HZ + 6; y++) { let c = x < 126 ? N("#6FAE55", "#2F4B38") : N("#4F8E42", "#243B2E"); if (y === top) c = N("#92C874", "#3B5A46"); if (K.hash(x, y) < 0.05) c = N("#3F7A38", "#1E3228"); px(x, y, c); } }
  const sx = 126, sb = hill(126); const S1 = N("#F4F1EA", "#B8B8D4"), S2 = N("#D6D0C4", "#8A8AA8");
  for (let y = sb - 3; y < sb; y++) for (let x = sx - 2; x <= sx + 2; x++) px(x, y, x < sx ? S1 : S2);
  for (let y = sb - 15; y < sb - 3; y++) { px(sx - 1, y, S1); px(sx, y, S1); px(sx + 1, y, S2); }
  px(sx - 2, sb - 5, S1); px(sx + 2, sb - 5, S2);
  for (let x = sx - 8; x <= sx + 8; x++) { px(x, sb - 13, x <= sx ? S1 : S2); px(x, sb - 12, S2); }
  px(sx, sb - 16, S1); px(sx + 1, sb - 16, S2); px(sx, sb - 17, S1);
  if (night) { for (let k = -3; k <= 3; k++) px(sx + k, sb + 1, "#FFD27A"); }
  const palm = (bx, by) => { plantShadow(K, bx, by, 4); for (let i = 0; i < 16; i++) { const x = bx + Math.round(Math.sin(i / 9) * 3), y = by - i; px(x, y, i % 3 === 0 ? N("#8A5A34", "#3A2E3A") : N("#A8713F", "#4A3A48")); px(x + 1, y, N("#8A5A34", "#3A2E3A")); } const tx = bx + Math.round(Math.sin(15 / 9) * 3), ty = by - 16;
    const fr = (dx, dy, len) => { for (let k = 1; k <= len; k++) { const x = tx + Math.round(dx * k), y = ty + Math.round(dy * k + 0.08 * k * k); px(x, y, N("#5DA84E", "#2F4A45")); px(x, y + 1, N("#3F7F38", "#233833")); if (k < len - 1) px(x, y - 1, N("#7CC262", "#3D5E55")); } };
    fr(1, -0.35, 7); fr(-1, -0.35, 7); fr(0.9, 0.25, 6); fr(-0.9, 0.25, 6); fr(0.3, -0.9, 3); };
  palm(18, 66); palm(52, 62);
  return K.c; }

// ---------- PETRA
function scenePetra(night) { const K = SceneKit(night), { px, HZ, N } = K; K.sky();
  const R = [N("#E7A58E", "#6A4A60"), N("#D98E77", "#5C4056"), N("#C77A66", "#4E364C"), N("#B56A58", "#422E42")];
  K.ground({ g1: N("#EDC2A6", "#5A4458"), g2: N("#E6B394", "#503C50"), g3: N("#DDA586", "#473548"), speck: N("#C98E72", "#3C2C3E"), speckHi: N("#F4D2BC", "#6A5468") });
  const wall = (x0, x1, edge) => { for (let x = x0; x <= x1; x++) { const e = edge(x); for (let y = 0; y < 62; y++) { if (y < e) continue; let c = R[(Math.floor((y + Math.sin(x / 5) * 2) / 5)) % 2]; if (x >= x1 - 2 && x0 > 0) c = R[0]; if (x <= x0 + 2 && x0 === 0) c = R[2]; if ((y + (x % 3 === 0 ? 1 : 0)) % 9 === 0) c = R[3]; px(x, y, c); } } };
  wall(0, 34, (x) => Math.round(x * 0.15));
  wall(126, 159, (x) => Math.round((159 - x) * 0.15));
  for (let x = 35; x < 126; x++) for (let y = 6; y < HZ + 4; y++) px(x, y, ((y + Math.round(Math.sin(x / 6) * 2)) % 9 === 0) ? R[2] : ((x + y) % 11 === 0 ? R[2] : R[1]));
  const cx = 80, base = 54, F1 = N("#F2B89F", "#7A5670"), F2 = N("#D99A82", "#624660"), Dk = N("#6A3A30", "#241A2C");
  for (let y = 12; y < base; y++) { px(cx - 26, y, R[3]); px(cx + 26, y, R[3]); }
  for (let y = base - 18; y < base; y++) for (let x = cx - 24; x <= cx + 24; x++) px(x, y, (x - cx + 24) % 8 < 2 ? F1 : F2);
  for (let x = cx - 26; x <= cx + 26; x++) { px(x, base - 19, F1); px(x, base - 20, F2); }
  for (let k = 0; k < 6; k++) for (let x = cx - 10 + k; x <= cx + 10 - k; x++) px(x, base - 21 - k, k === 5 ? F2 : F1);
  for (let y = base - 12; y < base; y++) for (let x = cx - 3; x <= cx + 3; x++) px(x, y, night && y > base - 7 ? "#FFC766" : Dk);
  for (let y = base - 38; y < base - 26; y++) { for (let x = cx - 24; x <= cx - 12; x++) px(x, y, (x % 4 < 1) ? F1 : F2); for (let x = cx + 12; x <= cx + 24; x++) px(x, y, (x % 4 < 1) ? F1 : F2); }
  for (let y = base - 38; y < base - 26; y++) for (let x = cx - 6; x <= cx + 6; x++) px(x, y, (x - cx + 6) % 4 < 1 ? F1 : F2);
  for (let k = 0; k < 4; k++) for (let x = cx - 6 + k; x <= cx + 6 - k; x++) px(x, base - 39 - k, F1);
  px(cx, base - 43, F2); px(cx - 1, base - 44, F1); px(cx, base - 44, F1); px(cx + 1, base - 44, F2); px(cx, base - 45, F1);
  [[46, 64], [114, 64]].forEach(([lx, ly]) => { px(lx, ly + 1, N("#C98E72", "#3C2C3E")); px(lx, ly, N("#5B4A3A", "#2A2030")); px(lx, ly - 1, night ? "#FFD27A" : N("#E0B46A", "#8A6A50")); px(lx, ly - 2, N("#5B4A3A", "#2A2030")); if (night) { px(lx - 1, ly - 1, "#C98A40"); px(lx + 1, ly - 1, "#C98A40"); } });
  return K.c; }

// ---------- GREAT WALL: hazy far peaks (Machu-style pk()), a near ridge y(x) the wall rides,
// 2 watchtowers with crenellations + a lit window at night, grass ground, pines
function sceneWall(night) { const K = SceneKit(night), { px, HZ, N, hash } = K; K.sky(); K.cloud(20, 10, 14); K.cloud(120, 16, 18);
  const farPk = (cx, top, hw) => { for (let y = top; y < HZ; y++) { const t = (y - top) / (HZ - top); const w = Math.round(hw * Math.pow(t, 0.7)); for (let x = cx - w; x <= cx + w; x++) px(x, y, N("#9FC2B0", "#33453F")); } };
  farPk(24, 22, 22); farPk(66, 28, 18); farPk(132, 20, 26);
  const ridge = (x) => HZ - Math.sin(Math.PI * x / 159) * (13 + 3 * Math.sin(x / 11));
  const litC = N("#7CB25E", "#33503C"), darkC = N("#5C9346", "#28402F"), speck = N("#8FC46E", "#3D5A44");
  for (let x = 0; x < 160; x++) { const r = Math.round(ridge(x)); const rising = ridge(x) <= ridge(Math.max(0, x - 1));
    for (let y = r; y < HZ; y++) { let c = rising ? litC : darkC; if (hash(x, y) < 0.05) c = speck; px(x, y, c); } }
  K.ground(grass(K));
  const wLit = N("#E4C48A", "#8A7E86"), wMid = N("#D2AE74", "#6E6678"), wShade = N("#B8955E", "#565068");
  for (let x = 0; x < 160; x++) { const r = Math.round(ridge(x));
    for (let y = r - 3; y <= r; y++) px(x, y, y === r - 3 ? wLit : x % 4 < 2 ? wMid : wShade);
    if (x % 2 === 0) px(x, r - 4, wLit);
  }
  const towers = [46, 120];
  towers.forEach((tx) => { const tb = Math.round(ridge(tx));
    for (let y = 0; y < 10; y++) for (let dx = -5; dx <= 4; dx++) px(tx + dx, tb - 4 - y, dx < 0 ? wLit : wMid);
    for (let dx = -5; dx <= 4; dx += 2) px(tx + dx, tb - 14, wLit);
    for (let y = 0; y < 3; y++) for (let dx = -1; dx <= 0; dx++) px(tx + dx, tb - 9 + y, night ? "#FFC766" : "#2A2030");
    for (let dx = 5; dx <= 9; dx++) px(tx + dx, tb + 1, N("#6F9446", "#2A3628"));
  });
  const pine = (bx, by) => { plantShadow(K, bx, by, 2); px(bx, by, N("#6B4A2E", "#3A2E3A"));
    for (let i = 0; i < 4; i++) { const w = 4 - i, y = by - 2 - i * 3; for (let dx = -w; dx <= w; dx++) px(bx + dx, y, dx < 0 ? N("#5DA84E", "#2F4A45") : N("#3F7F38", "#233833")); } };
  pine(20, 64); pine(140, 66); pine(84, 70);
  return K.c; }

/* ---- register: these draw their own canvas, so the wrapper just blits it ---- */
[["colosseum", sceneColosseum], ["machupicchu", sceneMachu], ["tajmahal", sceneTaj], ["christ", sceneChrist], ["petra", scenePetra], ["wall", sceneWall]]
  .forEach(([key, fn]) => registerScene(key, (ctx, P, night) => ctx.drawImage(fn(night), 0, 0)));
