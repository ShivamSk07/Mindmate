const SEARCH_TRIGGER_KEYWORDS = [
  // English
  "latest", "current", "live",
  "news", "weather", "score",
  "trending", "stock", "crypto", "bitcoin", "forecast",
  "happening", "announced", "released", "launched",
  "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "who is", "what is the current", "how much is",
  "ipl", "wpl", "t20", "world cup", "olympics", "champions trophy",
  "champion", "points table", "schedule",
  // Hinglish
  "taza",
  "khabar", "score kya hai", "kitna hai",
  "kya hua", "kab hai", "kahan hai", "batao abhi",
  "jeeta", "jeetne", "kaun jeeta"
];

const SEARCH_TRIGGER_PATTERNS = [
  /\b(what|who|when|where|how).*(today|now|current|latest|live)\b/i,
  /\b(kya|kaun|kab|kahan|kitna).*(aaj|abhi|latest)\b/i,
  /\b(price|cost|rate).*(of|ka|ki)\b/i,
  /\b(today'?s?|aaj ka).*(news|weather|score|price|match)\b/i,
  /\b(latest|newest|recent).*(version|update|news|release)\b/i,
  /\b(match|game|tournament).*(score|result|winner|points|table)\b/i,
  /\b(stock|share).*(price|market|rate)\b/i,
  /\b(202[4-9]|2030)\b/i, // Matches any year from 2024 to 2030
  /\b(ipl|wpl|t20|world cup|olympics)\b/i,
];

export function needsWebSearch(query: string): boolean {
  const queryLower = query.toLowerCase().trim();

  for (const keyword of SEARCH_TRIGGER_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(queryLower)) {
      return true;
    }
  }

  for (const pattern of SEARCH_TRIGGER_PATTERNS) {
    if (pattern.test(queryLower)) {
      return true;
    }
  }

  return false;
}

export function extractSearchQuery(userQuery: string): string {
  const fillerWords = [
    "mujhe batao", "bata do", "bata", "please", "yaar", "bhai",
    "kya hai", "tell me", "what is", "can you", "could you",
    "please tell me", "i want to know", "mujhe chahiye",
  ];

  let cleaned = userQuery.toLowerCase().trim();

  for (const filler of fillerWords) {
    cleaned = cleaned.replace(new RegExp(filler, "gi"), "");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}
