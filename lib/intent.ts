const SEARCH_TRIGGER_KEYWORDS = [
  // English
  "latest", "current", "live", "today", "now", "recent",
  "news", "weather", "score", "match", "result", "winner",
  "trending", "stock", "crypto", "bitcoin", "forecast", "price",
  "happening", "announced", "released", "launched", "update", "version",
  "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "who is", "what is", "where is", "when is", "how much",
  "ipl", "wpl", "t20", "world cup", "olympics", "champions trophy",
  "champion", "points table", "schedule", "ceo", "president", "prime minister",
  "deepseek", "openai", "gpt", "gemini", "claude", "next.js", "react",
  // Hinglish / Hindi
  "taza", "khabar", "score kya", "kitna hai", "aaj ka", "aaj ki",
  "kya hua", "kab hai", "kahan hai", "batao abhi", "jeeta", "kaun jeeta",
  "nayi", "naya", "haalat", "samachar", "bhav", "daam", "rate"
];

const SEARCH_TRIGGER_PATTERNS = [
  /\b(what|who|when|where|how).*(today|now|current|latest|live|recent|news|score)\b/i,
  /\b(kya|kaun|kab|kahan|kitna).*(aaj|abhi|latest|taza|khabar)\b/i,
  /\b(price|cost|rate|market|stock|share).*(of|ka|ki|today|now)\b/i,
  /\b(today'?s?|aaj ka|aaj ki).*(news|weather|score|price|match|khabar)\b/i,
  /\b(latest|newest|recent).*(version|update|news|release|model|ai)\b/i,
  /\b(match|game|tournament|cup).*(score|result|winner|points|table|status)\b/i,
  /\b(202[4-9]|2030)\b/i,
  /\b(ipl|wpl|t20|world cup|olympics|trophy)\b/i,
  /\b(who is the|what is the current|where is the)\b/i,
  /\b(tell me about|information on|details of|who won|who is)\b/i
];

export function needsWebSearch(query: string): boolean {
  const queryLower = query.toLowerCase().trim();

  // Explicit research command or search intent
  if (queryLower.startsWith("/research") || queryLower.startsWith("/search")) {
    return true;
  }

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
    "mujhe batao", "bata do", "batao", "bata", "please", "yaar", "bhai",
    "kya hai", "tell me about", "tell me", "what is", "can you", "could you",
    "please tell me", "i want to know", "mujhe chahiye", "search for",
    "/research", "/search"
  ];

  let cleaned = userQuery.toLowerCase().trim();

  for (const filler of fillerWords) {
    cleaned = cleaned.replace(new RegExp(filler, "gi"), "");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned.length > 2 ? cleaned : userQuery.trim();
}
