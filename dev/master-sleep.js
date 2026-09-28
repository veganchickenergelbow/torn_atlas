// MASTER SLEEP LOAF (32x24), hand-tuned against the user's sleeping-cat references.
// Same palette letters as the standing master: O outline, B base, S shade, L light, N pink (nose/blush), I inner ear.
// Head on the right (face to viewer, closed "- -" eyes + blush), rounded back rising toward the head,
// tail wrapped along the front (rows 19-22), front paws (L) tucked under the chin.
// "z" particles are drawn separately (see drawZ) and float/fade upward above the head-left.
window.MASTER_SLEEP = [
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
"................................"];
// z particle: size 2 (small) or 3 (big), drawn in outline colour
window.drawZ = (ctx, zx, zy, s) => { for (let i = 0; i <= s; i++) { ctx.fillRect(zx+i, zy, 1, 1); ctx.fillRect(zx+i, zy+s, 1, 1); ctx.fillRect(zx+s-i, zy+i, 1, 1); } };
