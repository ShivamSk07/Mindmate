// Specific live patterns where real-time web search is actually required
const LIVE_SEARCH_PATTERNS = [
  // Weather queries
  /\b(weather|mausam|temperature|forecast)\b/i,

  // Financial / Market live prices
  /\b(price|rate|bhav|daam|cost)\b.*\b(gold|silver|bitcoin|btc|eth|crypto|stock|share|sensex|nifty|today|aaj)\b/i,
  /\b(gold|silver|bitcoin|btc|eth|crypto|stock|share|sensex|nifty)\b.*\b(price|rate|bhav|daam|today|aaj)\b/i,

  // Sports live updates & scores
  /\b(live score|match score|cricket score|points table|ipl|wpl|t20|world cup|champions trophy)\b/i,
  /\b(who won|winner of|score of).*(match|cup|tournament|today|yesterday|kal)\b/i,

  // News & Current Events
  /\b(breaking news|latest news|today'?s? news|aaj ki (taza )?khabar|current news|headlines)\b/i,

  // Current political or corporate leaders (time-sensitive)
  /\b(current|present)\s+(ceo|president|prime minister|governor|captain|coach)\b/i,
  /\b(who is (the )?current|abhi kaun hai)\s+(ceo|president|prime minister|governor|captain|coach)\b/i,

  // Recent 2025/2026 releases or upcoming dates
  /\b(release date|kab release|launch date)\b.*\b(movie|show|series|season|episode|album|game|iphone)\b/i,
  /\b(movie|show|series|season|episode|album|game|iphone)\b.*\b(release date|kab release|launch date)\b/i,
  /\b(latest|newest)\s+(update|news|version|release)\s+(in|of|for)\s+202[5-9]\b/i
];

// Patterns that MUST NOT trigger web search (coding, math, general concepts, conversation)
const NON_SEARCH_PATTERNS = [
  /\b(write|create|build|implement|debug|fix|refactor|optimize|explain|help with|how to|what is|how do|can you)\b.*\b(code|function|component|hook|api|class|algorithm|regex|sql|css|html|javascript|typescript|react|next|node|python|bug|error)\b/i,
  /\b(tell me about yourself|who are you|how are you|kaise ho|kya haal|kya hal|good morning|hello|hi|hey|thanks|thank you)\b/i
];

export function needsWebSearch(query: string): boolean {
  const queryLower = query.toLowerCase().trim();

  // 1. Explicit search command or intent
  if (
    queryLower.startsWith("/research") ||
    queryLower.startsWith("/search") ||
    queryLower.startsWith("search for ") ||
    queryLower.startsWith("google for ") ||
    queryLower.startsWith("browse for ") ||
    queryLower.startsWith("find online ")
  ) {
    return true;
  }

  // 2. Ignore search for general coding/conceptual questions
  for (const nonSearchPattern of NON_SEARCH_PATTERNS) {
    if (nonSearchPattern.test(queryLower)) {
      return false;
    }
  }

  // 3. Check for specific time-sensitive live patterns
  for (const pattern of LIVE_SEARCH_PATTERNS) {
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
