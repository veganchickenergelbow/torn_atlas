// Cat Utopia — persistent progression data, milestone/award logic.
const CATS_KEY = "atlas-cats";

const CAT_BREEDS = {
  EG: ["Egyptian Mau", "Egyptian Maus are one of the few naturally spotted cat breeds, and among the fastest domestic cats."],
  JP: ["Japanese Bobtail", "Japanese Bobtails have a naturally short, pom-pom tail and inspired the beckoning maneki-neko cat."],
  TH: ["Siamese", "Siamese cats have striking blue eyes and a sleek coat; Thailand's Korat is another native breed with a silvery-blue coat."],
  RU: ["Russian Blue", "Russian Blues have a silvery double coat and green eyes."],
  NO: ["Norwegian Forest Cat", "Norwegian Forest Cats have a thick, water-resistant double coat built for cold winters."],
  IR: ["Persian", "Persians are known for their long, flowing coat and flat, round face."],
  TR: ["Turkish Van", "Turkish Vans love water and have a mostly white coat with color only on the head and tail; the Turkish Angora is a related breed known for pure white fur."],
  MM: ["Burmese", "Burmese cats have a compact, muscular body and a short, glossy coat."],
  SG: ["Singapura", "Singapuras are one of the smallest cat breeds, with big eyes and ears."],
  CY: ["Cyprus Aphrodite", "The Cyprus Aphrodite is a natural breed with a lean body, said to descend from cats brought to Cyprus thousands of years ago."],
  US: ["Maine Coon", "Maine Coons are one of the largest domesticated cat breeds, with a shaggy coat and tufted ears."],
  GB: ["British Shorthair", "British Shorthairs have a dense, plush coat and a round, chubby face."],
  CA: ["Sphynx", "Sphynx cats are famously hairless, with warm, suede-like skin."],
  KE: ["Sokoke", "Sokokes originated among the Giriama people near Kenya's Arabuko-Sokoke forest and have a striking marbled coat."],
  BR: ["Brazilian Shorthair", "The Brazilian Shorthair was the first cat breed developed in Brazil, prized for its short, sleek coat."],
  FR: ["Chartreux", "Chartreux cats have a dense blue-grey coat and what looks like a natural smile."],
};
const CAT_NAMES = ["Mochi", "Biscuit", "Pip-squeak", "Noodle", "Pepper", "Saffron", "Tofu", "Maple", "Olive",
  "Churro", "Kiwi", "Sushi", "Pierogi", "Baklava", "Dumpling", "Mango", "Nutmeg", "Paprika", "Waffle", "Clementine"];

function catRarity(cc) {
  if (CAT_BREEDS[cc]) return "legendary";
  const w = (typeof WORLD !== "undefined" && WORLD[cc]) || {};
  if ((w.col || []).length >= 3) return "rare";
  return "common";
}
function catBreedName(cc) {
  return CAT_BREEDS[cc] ? CAT_BREEDS[cc][0] : catRarity(cc) === "rare" ? "Patchwork Shorthair" : "Alley Shorthair";
}
function catBreedFact(cc) {
  if (CAT_BREEDS[cc]) return CAT_BREEDS[cc][1];
  const w = (typeof WORLD !== "undefined" && WORLD[cc]) || {};
  return `A cheerful little traveller from ${w.n || "somewhere on the map"}, happiest curled up in the sun.`;
}
function catPickName(cc) {
  const idx = catHash(cc, "name") % CAT_NAMES.length;
  return CAT_NAMES[idx];
}

function loadCats() {
  try {
    const raw = localStorage.getItem(CATS_KEY);
    if (!raw) return { lifetimeCorrect: 0, cats: [], wondersSeen: [], milestonesReached: 0 };
    const d = JSON.parse(raw);
    return {
      lifetimeCorrect: d.lifetimeCorrect || 0,
      cats: d.cats || [],
      wondersSeen: d.wondersSeen || [],
      milestonesReached: d.milestonesReached || 0,
    };
  } catch (e) { return { lifetimeCorrect: 0, cats: [], wondersSeen: [], milestonesReached: 0 }; }
}
function saveCatsState(s) { try { localStorage.setItem(CATS_KEY, JSON.stringify(s)); } catch (e) {} }

const Cats = (() => {
  let state = loadCats();
  if (!state.wondersSeen.includes("pyramid")) { state.wondersSeen.push("pyramid"); saveCatsState(state); }

  function gapForIndex(i) { return Math.min(3 + i, 10); }
  // Derived purely from lifetimeCorrect so it stays correct even if stored
  // cats/milestonesReached ever disagree with it (e.g. manually-seeded state):
  // the next threshold is simply the first one greater than lifetimeCorrect.
  function milestoneInfo(lifetimeCorrect) {
    let thr = 0, i = 0;
    while (thr + gapForIndex(i) <= lifetimeCorrect) { thr += gapForIndex(i); i++; }
    return { index: i, prevThreshold: thr, nextThreshold: thr + gapForIndex(i) };
  }
  function progress() {
    const m = milestoneInfo(state.lifetimeCorrect);
    return { have: state.lifetimeCorrect - m.prevThreshold, need: m.nextThreshold - m.prevThreshold, nextThreshold: m.nextThreshold };
  }
  function ownedSet() { return new Set(state.cats.map((c) => c.cc)); }

  function makeCat(cc) {
    return { id: cc + "-" + Date.now() + "-" + Math.floor(Math.random() * 1e4), cc, name: catPickName(cc),
      breed: catBreedName(cc), rarity: catRarity(cc), level: 1, foundAt: Date.now() };
  }
  function pickCountry(themeCC) {
    const owned = ownedSet();
    if (!owned.has(themeCC)) return { cc: themeCC, friend: false };
    const ct = (WORLD[themeCC] || {}).ct;
    const sameCont = LIST.filter((cc) => WORLD[cc].ct === ct && !owned.has(cc));
    if (sameCont.length) return { cc: rnd(sameCont), friend: false };
    const anyUnowned = LIST.filter((cc) => !owned.has(cc));
    if (anyUnowned.length) return { cc: rnd(anyUnowned), friend: false };
    return { cc: themeCC, friend: true };
  }
  function awardCat(themeCC, reason) {
    const { cc, friend } = pickCountry(themeCC);
    let cat, isNew;
    if (friend) {
      cat = state.cats.find((c) => c.cc === themeCC);
      if (!cat) { cat = makeCat(themeCC); state.cats.push(cat); isNew = true; }
      else { cat.level = Math.min(3, (cat.level || 1) + 1); isNew = false; }
    } else {
      cat = makeCat(cc);
      state.cats.push(cat);
      isNew = true;
    }
    saveCatsState(state);
    return { cat, isNew, friend, reason };
  }
  function recordCorrect(themeCC) {
    const before = milestoneInfo(state.lifetimeCorrect);
    state.lifetimeCorrect++;
    let reward = null;
    if (state.lifetimeCorrect >= before.nextThreshold) {
      reward = awardCat(themeCC, "milestone");
      state.milestonesReached = before.index + 1;
    }
    saveCatsState(state);
    return { progress: progress(), reward };
  }
  function awardBonus(themeCC) {
    const reward = awardCat(themeCC, "perfect");
    saveCatsState(state);
    return reward;
  }
  function markWonderSeen(key) {
    if (state.wondersSeen.includes(key)) return false;
    state.wondersSeen.push(key);
    saveCatsState(state);
    return true;
  }
  function reset() {
    state = { lifetimeCorrect: 0, cats: [], wondersSeen: [], milestonesReached: 0 };
    saveCatsState(state);
  }
  function reload() { state = loadCats(); }
  return {
    get lifetimeCorrect() { return state.lifetimeCorrect; },
    get cats() { return state.cats; },
    get wondersSeen() { return state.wondersSeen; },
    progress, recordCorrect, awardBonus, markWonderSeen, reset, reload,
  };
})();
