export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const cacheKey = getCacheKey(query);
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Search] Cache hit for:", query);
    return cached.results;
  }

  try {
    console.log(`[Search] Fetching DDG Lite for query: "${query}"`);
    const encodedQuery = encodeURIComponent(query);
    const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`DDG Lite request failed: ${response.status}`);
    }

    const html = await response.text();
    const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const results: SearchResult[] = [];
    let currentLink: { title: string; url: string } | null = null;

    for (const tr of trs) {
      // 1. Identify and extract result links
      if (tr.includes("class='result-link'") || tr.includes('class="result-link"')) {
        const aRegex = /<a[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/i;
        const aMatch = aRegex.exec(tr);
        if (aMatch) {
          const cleanTitle = aMatch[1]
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          
          const hrefMatch = /href=(['"])([\s\S]*?)\1/i.exec(aMatch[0]);
          let rawUrl = hrefMatch ? hrefMatch[2] : "";

          if (rawUrl.startsWith("//")) {
            rawUrl = "https:" + rawUrl;
          }

          if (rawUrl.includes("uddg=")) {
            try {
              const urlParams = new URLSearchParams(rawUrl.split("?")[1]);
              rawUrl = urlParams.get("uddg") || rawUrl;
            } catch (e) {
              // ignore params parse errors
            }
          }

          currentLink = { title: cleanTitle, url: rawUrl };
        }
      } 
      // 2. Identify and extract snippets, then pair them with the last found link
      else if ((tr.includes("class='result-snippet'") || tr.includes('class="result-snippet"')) && currentLink) {
        const tdRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/i;
        const tdMatch = tdRegex.exec(tr);
        if (tdMatch) {
          const cleanSnippet = tdMatch[1]
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();

          results.push({
            title: currentLink.title,
            snippet: cleanSnippet,
            url: currentLink.url
          });

          currentLink = null; // Clear it to avoid double-assignment
        }
      }
    }

    const trimmedResults = results.slice(0, maxResults);
    console.log(`[Search] Successfully parsed ${trimmedResults.length} search results`);

    searchCache.set(cacheKey, { results: trimmedResults, timestamp: Date.now() });
    return trimmedResults;

  } catch (error) {
    console.error("[Search Error]", error);
    return [];
  }
}

export function formatResultsForLLM(results: SearchResult[]): string {
  if (results.length === 0) return "";

  let formatted = "### Real-Time Web Search Results:\n\n";

  results.forEach((r, i) => {
    formatted += `[${i + 1}] ${r.title}\n`;
    formatted += `    ${r.snippet}\n`;
    formatted += `    Source: ${r.url}\n\n`;
  });

  return formatted.trim();
}
