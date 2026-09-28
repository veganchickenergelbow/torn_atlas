// Hand-written extras ported from the original Torn Atlas prototype.
const ALIASES_ASEAN = {
  BN: ["brunei", "brunei darussalam"], KH: ["cambodia", "kampuchea"], ID: ["indonesia"], LA: ["laos", "lao", "lao pdr"],
  MY: ["malaysia"], MM: ["myanmar", "burma"], PH: ["philippines", "the philippines", "philippine"], SG: ["singapore"],
  TH: ["thailand", "siam"], VN: ["vietnam", "viet nam"], TL: ["timor-leste", "timor leste", "east timor", "timor"],
};
const REDACT = {
  BN: ["Brunei Darussalam", "Brunei", "Bruneian", "Bandar Seri Begawan", "Hassanal Bolkiah", "Istana Nurul Iman", "Kampong Ayer", "Ulu Temburong", "Omar Ali Saifuddien"],
  KH: ["Cambodia", "Cambodian", "Khmer", "Phnom Penh", "Angkor Wat", "Angkor", "Tonlé Sap", "Bon Om Touk", "Siem Reap", "riel"],
  ID: ["Indonesia", "Indonesian", "Indonesians", "Jakarta", "Nusantara", "Borobudur", "Java", "Komodo", "Bali", "Balinese", "Sumatra", "Sang Merah Putih", "Monas"],
  LA: ["Laos", "Laotian", "Lao", "Vientiane", "Lan Xang", "Luang Prabang", "Plain of Jars", "Khone Phapheng", "Pha That Luang", "Lao Issara"],
  MY: ["Malaysia", "Malaysian", "Malaysians", "Kuala Lumpur", "Putrajaya", "Petronas", "Penang", "George Town", "Melaka", "Sabah", "Sarawak", "Kinabalu", "Jalur Gemilang", "Malaya"],
  MM: ["Myanmar", "Burma", "Burmese", "Naypyidaw", "Yangon", "Shwedagon", "Bagan", "thanaka", "longyi", "Inle", "Mohinga"],
  PH: ["Philippines", "Philippine", "Filipinos", "Filipino", "Manila", "Makati", "Bohol", "Luzon", "Visayas", "Mindanao", "jeepneys", "jeepney", "Intramuros"],
  SG: ["Singapore", "Singaporeans", "Singaporean", "Changi", "Toh Chin Chye", "Majulah Singapura", "Housing & Development Board", "Marina Bay", "Lau Pa Sat"],
  TH: ["Thailand", "Thais", "Thai", "Siam", "Bangkok", "Songkran", "Krung Thep", "Vajiravudh", "Thong Trairong", "Wat Arun"],
  VN: ["Vietnam", "Vietnamese", "Viet Nam", "Hanoi", "Ha Long", "Hang Sơn Đoòng", "Sơn Đoòng", "Tết", "Hội An", "Cờ đỏ sao vàng"],
  TL: ["Timor-Leste", "Timorese", "East Timor", "Dili", "Atauro", "Tetum", "Timor"],
};
const FLAG_NOTE = {
  AF: "Shown here is the black-red-green tricolour of the Islamic Republic, which the United Nations and most governments still recognise. Since August 2021 the Taliban government has flown a white flag bearing the Shahada inside the country.",
  SY: "This is the green-white-black flag with three red stars, adopted as the national flag after the fall of the Assad government in December 2024.",
  KG: "The sun's forty rays were redrawn as straight lines in December 2023. This is the current design.",
};
