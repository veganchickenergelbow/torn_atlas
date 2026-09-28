// Cat Utopia — cat identity: coat palettes/patterns, legendary breed looks,
// personalities, and the catSpriteHTML API used by utopia.js/dossier.js.
// Pixel grids are hand-authored in catsprites.js; this file only picks which
// grids/colors/behavior a given cat gets.

const CAT_OUTLINE = "#3B2A22";
// {base, shade, light, eye, pattern, variant, tail}
const COATS = {
  cream: { base: "#F3E4C8", eye: "#8A6A4A" },
  ginger: { base: "#E8A85C", eye: "#6B4A2A" },
  orangeTabby: { base: "#E8A85C", eye: "#6B4A2A", pattern: "tabby" },
  brownTabby: { base: "#B98A5E", eye: "#4A3626", pattern: "tabby" },
  greyTabby: { base: "#AEB0AA", eye: "#4E5A4E", pattern: "tabby" },
  blueGrey: { base: "#AEB9C4", eye: "#5E8A5E" },
  charcoal: { base: "#6E6469", eye: "#C9924A" }, // "black" — never pure black
  white: { base: "#F5F2E8", eye: "#6FA0C7" },
  calico: { base: "#F3E4C8", eye: "#6B4A2A", pattern: "calico" },
  tortie: { base: "#8A6754", eye: "#6B4A2A", pattern: "tortie" },
  tuxedo: { base: "#5B5259", eye: "#C9924A", pattern: "tuxedo" },
  siamesePoints: { base: "#F3E4C8", eye: "#5AA7E0", pattern: "points" },
  silverSpotted: { base: "#C9C9C0", eye: "#7CA07C", pattern: "spots" },
  sable: { base: "#8A6754", eye: "#C9924A" },
  sphynx: { base: "#E8C7B8", eye: "#8A6A4A" },
};
const COAT_KEYS = Object.keys(COATS);

const LEGENDARY_STYLE = {
  TH: { coat: "siamesePoints", variant: "lean", tail: "whip", breed: "Siamese" },
  RU: { coat: "blueGrey", variant: "chunky", tail: "curl", eye: "#7CBE7C", breed: "Russian Blue" },
  US: { coat: "brownTabby", variant: "fluffy", tail: "plume", tufts: true, breed: "Maine Coon" },
  CA: { coat: "sphynx", variant: "lean", tail: "whip", breed: "Sphynx" },
  EG: { coat: "silverSpotted", variant: "lean", tail: "whip", breed: "Egyptian Mau" },
  JP: { coat: "calico", variant: "standard", tail: "stub", breed: "Japanese Bobtail" },
  IR: { coat: "cream", variant: "fluffy", tail: "plume", breed: "Persian" },
  NO: { coat: "brownTabby", variant: "fluffy", tail: "plume", breed: "Norwegian Forest Cat" },
  TR: { coat: "white", variant: "standard", tail: "curl", pattern: "van", breed: "Turkish Van" },
  MM: { coat: "sable", variant: "standard", tail: "curl", breed: "Burmese" },
  SG: { coat: "ginger", variant: "lean", tail: "whip", breed: "Singapura" },
  CY: { coat: "brownTabby", variant: "lean", tail: "whip", breed: "Cyprus Aphrodite" },
  GB: { coat: "blueGrey", variant: "chunky", tail: "curl", eye: "#C9924A", breed: "British Shorthair" },
  KE: { coat: "brownTabby", variant: "lean", tail: "whip", breed: "Sokoke" },
  BR: { coat: "greyTabby", variant: "standard", tail: "curl", breed: "Brazilian Shorthair" },
  FR: { coat: "blueGrey", variant: "chunky", tail: "curl", eye: "#C9924A", breed: "Chartreux" },
};

function catRarityStyle(cat) {
  if (cat.variantOverride) return { coat: cat.coatOverride || "ginger", variant: cat.variantOverride, tail: cat.tailOverride || "curl" };
  const leg = LEGENDARY_STYLE[cat.cc];
  if (leg) return leg;
  const h = catHash(cat.cc, "style");
  const coat = COAT_KEYS[h % COAT_KEYS.length];
  const variant = ["standard", "standard", "chunky", "lean", "fluffy"][h % 5];
  const tail = variant === "fluffy" ? "plume" : variant === "lean" ? "whip" : "curl";
  return { coat, variant, tail };
}
function catPalette(cat) {
  const style = catRarityStyle(cat);
  const c = COATS[style.coat] || COATS.ginger;
  const base = c.base, shade1 = shade(base, -0.28), light = mix(base, "#ffffff", 0.55);
  const w = (typeof WORLD !== "undefined" && WORLD[cat.cc]) || {};
  const cols = (w.col && w.col.length ? w.col : ["orange"]).filter((x) => x !== "white");
  const collar = FLAG_PASTEL[cols[0]] || "#F2957E", tag = FLAG_PASTEL[cols[1] || cols[0]] || "#F2CE7E";
  return {
    O: CAT_OUTLINE, B: base, S: shade1, L: light, E: style.eye || c.eye, W: "#FFFFFF", N: "#E38B7A",
    I: "#E7A6A0", K: "#F2AFA0", C: collar, T: tag, X: shade(base, -0.42),
  };
}
function catPatternName(cat) {
  const leg = LEGENDARY_STYLE[cat.cc];
  if (leg) return leg.pattern || (COATS[leg.coat] || {}).pattern;
  return (COATS[catRarityStyle(cat).coat] || {}).pattern;
}

/* ---- personalities: deterministic per-cat, weight which activity is picked ---- */
const PERSONALITIES = {
  sleepy: { label: "Sleepy", blurb: "naps by the wonders", weights: { sleep: 5, roll: 2 } },
  zoomies: { label: "Zoomies", blurb: "tears around at top speed", weights: { run: 5, pounce: 3 } },
  foodie: { label: "Foodie", blurb: "always thinking about snacks", weights: { eat: 5, sitlook: 2 } },
  curious: { label: "Curious", blurb: "investigates every corner", weights: { walk: 4, sitlook: 3 } },
  playful: { label: "Playful", blurb: "pounces on anything that moves", weights: { pounce: 5 } },
  cuddly: { label: "Cuddly", blurb: "makes biscuits for company", weights: { knead: 5, sitlook: 2 } },
  sunbather: { label: "Sunbather", blurb: "stretches out in the warm spots", weights: { roll: 3, stretch: 4 } },
  tidy: { label: "Tidy", blurb: "grooms until spotless", weights: { groom: 5 } },
};
const PERSONALITY_KEYS = Object.keys(PERSONALITIES);
function catPersonality(cat) {
  const leg = LEGENDARY_STYLE[cat.cc];
  if (leg && leg.personality) return leg.personality;
  return PERSONALITY_KEYS[catHash(cat.cc, "pers") % PERSONALITY_KEYS.length];
}
function personalityActivity(cat) {
  const p = PERSONALITIES[catPersonality(cat)] || PERSONALITIES.curious;
  const keys = Object.keys(p.weights);
  const total = keys.reduce((s, k) => s + p.weights[k], 0);
  let r = catHash(cat.id || cat.cc, "act") % total;
  for (const k of keys) { if (r < p.weights[k]) return k; r -= p.weights[k]; }
  return keys[0];
}

/* ---- assembly: pose key -> composed, patterned, colored sprite-sheet HTML ---- */
function catFrames(cat, poseKey) {
  const style = catRarityStyle(cat);
  const entry = POSE_BUILDERS[poseKey] || POSE_BUILDERS.idle;
  const count = entry[1];
  const patternName = catPatternName(cat);
  const frames = [];
  for (let i = 0; i < count; i++) {
    const g = catBodyFrame(poseKey, i, style);
    if (poseKey === "sleep") applySleepPattern(g, patternName);
    else applyCoatPattern(g, patternName);
    frames.push(g);
  }
  return frames;
}
function catSpriteHTML(cat, poseKey, scale, opts = {}) {
  const frames = catFrames(cat, poseKey);
  const palette = catPalette(cat);
  const style = catRarityStyle(cat);
  const key = cat.cc + "|" + style.coat + "|" + style.variant + "|" + style.tail + "|" + poseKey;
  return pxSpriteHTML(key, frames, palette, scale, opts);
}
