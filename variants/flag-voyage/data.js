// Country data grouped into legs (regions). Each leg has 4 countries.
// The boss leg pulls from its own pool for a rapid-fire round.
// `code` is the ISO 3166-1 alpha-2 code, used to fetch a real flag image
// (flag emoji don't render as pictures on this Windows/Chromium build).

const LEGS = [
  {
    id: "europe",
    name: "European Coast",
    countries: [
      {
        id: "france", name: "France", code: "fr", capital: "Paris",
        continent: "Europe", language: "French", population: "68 million",
        clue: "Its flag flies over a tower made of iron lace, and its bakeries perfected the croissant.",
        funFact: "The Eiffel Tower was meant to be dismantled after 20 years, but radio antennas saved it.",
        odoLine: "Odo once got so lost circling the Eiffel Tower he had to ask a pigeon for directions.",
      },
      {
        id: "germany", name: "Germany", code: "de", capital: "Berlin",
        continent: "Europe", language: "German", population: "84 million",
        clue: "Three horizontal bands of black, red and gold fly over a nation famous for its autobahns.",
        funFact: "Germany has over 1,500 different types of sausage.",
        odoLine: "Odo tried to name every sausage he saw here. He gave up after forty.",
      },
      {
        id: "italy", name: "Italy", code: "it", capital: "Rome",
        continent: "Europe", language: "Italian", population: "59 million",
        clue: "Shaped like a boot, this country's flag mirrors the colors of a fresh margherita pizza.",
        funFact: "Italy has more UNESCO World Heritage Sites than any other country.",
        odoLine: "Odo insists the Leaning Tower is not falling — it's just resting.",
      },
      {
        id: "spain", name: "Spain", code: "es", capital: "Madrid",
        continent: "Europe", language: "Spanish", population: "47 million",
        clue: "Red and gold stripes fly over a land known for flamenco and midday siestas.",
        funFact: "Spain lets its citizens nap the workday away — the siesta tradition began to avoid the afternoon heat.",
        odoLine: "Odo napped through an entire siesta and woke up three hours later, very confused.",
      },
    ],
  },
  {
    id: "asia",
    name: "Eastern Passage",
    countries: [
      {
        id: "japan", name: "Japan", code: "jp", capital: "Tokyo",
        continent: "Asia", language: "Japanese", population: "124 million",
        clue: "A single red circle on white — the symbol of the rising sun.",
        funFact: "Japan has more than 5 million vending machines, selling everything from ramen to umbrellas.",
        odoLine: "Odo bought soup from a vending machine here. It was the best soup of his life.",
      },
      {
        id: "china", name: "China", code: "cn", capital: "Beijing",
        continent: "Asia", language: "Mandarin", population: "1.41 billion",
        clue: "One big gold star watches over four smaller ones on a field of red.",
        funFact: "The Great Wall of China stretches over 13,000 miles across the country.",
        odoLine: "Odo tried to fly the whole length of the Great Wall. He made it about a mile before lunch.",
      },
      {
        id: "india", name: "India", code: "in", capital: "New Delhi",
        continent: "Asia", language: "Hindi & English", population: "1.43 billion",
        clue: "Saffron, white and green stripes surround a navy wheel of 24 spokes.",
        funFact: "India is home to over 20 official languages and hundreds more spoken regionally.",
        odoLine: "Odo learned to say 'hello' in six languages here and forgot all of them by dinner.",
      },
      {
        id: "thailand", name: "Thailand", code: "th", capital: "Bangkok",
        continent: "Asia", language: "Thai", population: "72 million",
        clue: "Red, white and a thick blue band — the only Southeast Asian nation never colonized by Europe.",
        funFact: "Thailand's official name, Ratcha Anachak Thai, means 'Kingdom of Thailand.'",
        odoLine: "Odo says the floating markets are the only place he's shopped without ever landing.",
      },
    ],
  },
  {
    id: "americas",
    name: "Western Crossing",
    countries: [
      {
        id: "usa", name: "United States", code: "us", capital: "Washington, D.C.",
        continent: "North America", language: "English", population: "335 million",
        clue: "Fifty stars for fifty states, and thirteen stripes for the original colonies.",
        funFact: "The White House has 132 rooms and 35 bathrooms.",
        odoLine: "Odo counted the White House windows twice and got a different number both times.",
      },
      {
        id: "brazil", name: "Brazil", code: "br", capital: "Brasília",
        continent: "South America", language: "Portuguese", population: "216 million",
        clue: "A green field, a golden diamond, and a starry blue globe — home of the largest rainforest on Earth.",
        funFact: "Brazil shares a border with every South American country except Chile and Ecuador.",
        odoLine: "Odo tried to count the Amazon's birds. He may still be counting.",
      },
      {
        id: "mexico", name: "Mexico", code: "mx", capital: "Mexico City",
        continent: "North America", language: "Spanish", population: "129 million",
        clue: "Green, white and red, with an eagle eating a snake at its center.",
        funFact: "Mexico City is sinking about 20 inches a year because it was built on a drained lake bed.",
        odoLine: "Odo swears the eagle on the flag winked at him. Pip does not believe him.",
      },
      {
        id: "canada", name: "Canada", code: "ca", capital: "Ottawa",
        continent: "North America", language: "English & French", population: "39 million",
        clue: "A single red maple leaf between two red bands on white.",
        funFact: "Canada has more lakes than the rest of the world's lakes combined.",
        odoLine: "Odo tried to visit every lake. He's on lake number four out of roughly two million.",
      },
    ],
  },
];

const BOSS_LEG = {
  id: "boss",
  name: "The Cartographer's Trial",
  countries: [
    {
      id: "australia", name: "Australia", code: "au", capital: "Canberra",
      continent: "Oceania", language: "English", population: "26 million",
      clue: "The Southern Cross and a Union Jack share a deep blue sky.",
      funFact: "Australia is the only country that is also a continent.",
      odoLine: "Odo met a kookaburra here who laughed at his jokes. Finally, an audience.",
    },
    {
      id: "egypt", name: "Egypt", code: "eg", capital: "Cairo",
      continent: "Africa", language: "Arabic", population: "112 million",
      clue: "A golden eagle stands guard over red, white and black bands.",
      funFact: "The Great Pyramid of Giza was the tallest man-made structure for almost 4,000 years.",
      odoLine: "Odo perched on top of a pyramid and immediately regretted it — very windy up there.",
    },
    {
      id: "kenya", name: "Kenya", code: "ke", capital: "Nairobi",
      continent: "Africa", language: "Swahili & English", population: "55 million",
      clue: "A Maasai shield and spears rest across black, red and green bands.",
      funFact: "Kenya's Great Rift Valley is visible from space.",
      odoLine: "Odo tried to race a cheetah here. He does not like to talk about it.",
    },
    {
      id: "russia", name: "Russia", code: "ru", capital: "Moscow",
      continent: "Europe/Asia", language: "Russian", population: "144 million",
      clue: "White, blue and red bands stretch across the largest country on Earth.",
      funFact: "Russia spans 11 time zones — more than any other country.",
      odoLine: "Odo flew across every time zone in one trip and is still adjusting his internal clock.",
    },
    {
      id: "norway", name: "Norway", code: "no", capital: "Oslo",
      continent: "Europe", language: "Norwegian", population: "5.5 million",
      clue: "A blue cross outlined in white sits on a field of red, in the land of the midnight sun.",
      funFact: "Norway has more registered electric cars per capita than anywhere else in the world.",
      odoLine: "Odo stayed up all night under the midnight sun and completely lost track of bedtime.",
    },
  ],
};

const ALL_LEGS = [...LEGS, BOSS_LEG];

// Pip's short reaction lines, picked at random for correct/wrong answers.
const PIP_LINES = {
  correct: [
    "Pip spins with delight!",
    "Pip gives two thumbs up — er, wings up!",
    "Pip is doing a little victory hop.",
    "Pip says that was smooth sailing.",
  ],
  wrong: [
    "Pip winces and hides behind Odo.",
    "Pip says the seas got a little rough there.",
    "Pip points at the map, a bit confused too.",
    "Pip pats your shoulder — next one's yours.",
  ],
};
function pipLine(kind) {
  const lines = PIP_LINES[kind];
  return lines[Math.floor(Math.random() * lines.length)];
}
