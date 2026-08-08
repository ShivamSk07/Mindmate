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
  "captain", "coach", "head coach", "squad", "playing 11", "playing xi",
  "movie", "show", "series", "season", "episode", "release", "hustle",
  // Hinglish / Hindi
  "taza", "khabar", "score kya", "kitna hai", "aaj ka", "aaj ki", "aaj",
  "kya hua", "kab hai", "kahan hai", "batao abhi", "jeeta", "kaun jeeta",
  "nayi", "naya", "haalat", "samachar", "bhav", "daam", "rate",
  "mausam", "kaptaan", "kal", "parso", "kab aayega", "kab aayegi", "kab aayenge",
  "kon hai", "kaun hai", "kiska", "kisne", "konsa", "kaunsa"
];

const SEARCH_TRIGGER_PATTERNS = [
  /\b(what|who|when|where|how).*(today|now|current|latest|live|recent|news|score)\b/i,
  /\b(kya|kaun|kon|kab|kahan|kitna).*(aaj|abhi|latest|taza|khabar|kal)\b/i,
  /\b(price|cost|rate|market|stock|share).*(of|ka|ki|today|now)\b/i,
  /\b(today'?s?|aaj ka|aaj ki|aaj).*(news|weather|mausam|score|price|match|khabar)\b/i,
  /\b(latest|newest|recent).*(version|update|news|release|model|ai|season|episode|show)\b/i,
  /\b(match|game|tournament|cup).*(score|result|winner|points|table|status|captain)\b/i,
  /\b(202[4-9]|2030)\b/i,
  /\b(ipl|wpl|t20|world cup|olympics|trophy)\b/i,
  /\b(who is the|what is the current|where is the)\b/i,
  /\b(tell me about|information on|details of|who won|who is)\b/i,
  /\b(weather|mausam|temperature|temp)\b/i,
  /\b(captain|kaptaan)\b/i,
  /\b(show|hustle|season|episode|release date|movie)\b/i,
  /\b(kal|parso|upcoming|next)\b/i
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
    "/research", "/search", "aane wala hai", "aane wali hai", "aaj ka", "aaj ki"
  ];

  let cleaned = userQuery.toLowerCase().trim();

  for (const filler of fillerWords) {
    cleaned = cleaned.replace(new RegExp(filler, "gi"), "");
  }

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Smart query enhancement for common terms
  if (cleaned.includes("weather") || cleaned.includes("mausam")) {
    // Extract city name from query if present
    const cityMatch = userQuery.match(/(?:weather|mausam)(?:\s+(?:in|of|at|for))?\s+([a-zA-Z ]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : "";
    if (city && city.length > 2) {
      return `${city} weather forecast today 2026`;
    }
    return "current weather today 2026";
  }

  if (cleaned.includes("captain") || cleaned.includes("kaptaan")) {
    return cleaned + " captain 2025 2026";
  }

  if (cleaned.includes("hustle") || cleaned.includes("show")) {
    return cleaned + " latest news release date";
  }

  // Append year for freshness on factual queries
  if ((cleaned.includes("who is") || cleaned.includes("kaun hai") || cleaned.includes("kon hai")) && cleaned.length > 8) {
    return cleaned + " 2025 2026";
  }

  return cleaned.length > 2 ? cleaned : userQuery.trim();
}

/**
 * Autonomous AI Intent Detector:
 * Combines fast keyword heuristics with an AI LLM decision check.
 */
export async function detectSearchIntentWithAI(
  userQuery: string
): Promise<{ needsSearch: boolean; searchQuery: string }> {
  // 1. Fast Heuristic Check
  if (needsWebSearch(userQuery)) {
    return {
      needsSearch: true,
      searchQuery: extractSearchQuery(userQuery),
    };
  }

  const lower = userQuery.toLowerCase().trim();
  const casualPhrases = ["hi", "hello", "hey", "kaise ho", "kya haal hai", "thanks", "thank you", "ok", "bye", "good morning", "good night"];
  if (casualPhrases.includes(lower) || lower.length < 4) {
    return { needsSearch: false, searchQuery: "" };
  }

  // 2. Autonomous AI Intent Judge (Fallthrough for complex/unseen queries)
  try {
    const { getCerebrasClient, MODEL } = await import("./cerebras");
    const client = getCerebrasClient();

    const judgePrompt =
      "You are an autonomous real-time web search detector. " +
      "Analyze if answering this prompt requires live, current, real-time, or recent web data " +
      "(such as today's weather, latest sports captains/scores, upcoming show/movie release dates, recent news, current events, recent versions, stock prices, or people's current roles). " +
      `User Prompt: "${userQuery}"\n\n` +
      "Output ONLY valid JSON:\n" +
      '{"needsSearch": true, "searchQuery": "optimal Google/DDG search terms"}\n' +
      "OR\n" +
      '{"needsSearch": false, "searchQuery": ""}';

    const completion = (await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: judgePrompt }],
      temperature: 0.0,
      max_tokens: 60,
    })) as any;

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        needsSearch: Boolean(parsed.needsSearch),
        searchQuery: String(parsed.searchQuery || userQuery).trim(),
      };
    }
  } catch (err) {
    console.warn("[AI Search Intent Detector Error]", err);
  }

  return { needsSearch: false, searchQuery: "" };
}
