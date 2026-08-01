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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 1800): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. DuckDuckGo Lite Parser
async function searchDDGLite(query: string, maxResults: number): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    }
  }, 1800);

  if (!response.ok) return [];

  const html = await response.text();
  const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const results: SearchResult[] = [];
  let currentLink: { title: string; url: string } | null = null;

  for (const tr of trs) {
    if (tr.includes("class='result-link'") || tr.includes('class="result-link"')) {
      const aRegex = /<a[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/i;
      const aMatch = aRegex.exec(tr);
      if (aMatch) {
        const cleanTitle = aMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        const hrefMatch = /href=(['"])([\s\S]*?)\1/i.exec(aMatch[0]);
        let rawUrl = hrefMatch ? hrefMatch[2] : "";

        if (rawUrl.startsWith("//")) rawUrl = "https:" + rawUrl;
        if (rawUrl.includes("uddg=")) {
          try {
            const urlParams = new URLSearchParams(rawUrl.split("?")[1]);
            rawUrl = urlParams.get("uddg") || rawUrl;
          } catch (e) {}
        }
        currentLink = { title: cleanTitle, url: rawUrl };
      }
    } else if ((tr.includes("class='result-snippet'") || tr.includes('class="result-snippet"')) && currentLink) {
      const tdRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/i;
      const tdMatch = tdRegex.exec(tr);
      if (tdMatch) {
        const cleanSnippet = tdMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        results.push({
          title: currentLink.title,
          snippet: cleanSnippet,
          url: currentLink.url
        });
        currentLink = null;
      }
    }
  }

  return results.slice(0, maxResults);
}

// 2. DuckDuckGo HTML Version Parser (Fallback)
async function searchDDGHTML(query: string, maxResults: number): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    }
  }, 1800);

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  // Match result divs: <div class="result ...">...</div>
  const resultBlocks = html.match(/<div[^>]*class=["'][^"']*result\s[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];

  for (const block of resultBlocks) {
    const titleMatch = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(block);
    const snippetMatch = /<a[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<div[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(block);

    if (titleMatch) {
      const cleanTitle = titleMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const hrefMatch = /href=["']([^"']+)["']/i.exec(titleMatch[0]);
      let rawUrl = hrefMatch ? hrefMatch[1] : "";

      if (rawUrl.includes("uddg=")) {
        try {
          const urlParams = new URLSearchParams(rawUrl.split("?")[1]);
          rawUrl = urlParams.get("uddg") || rawUrl;
        } catch (e) {}
      }

      const cleanSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : cleanTitle;

      if (cleanTitle && rawUrl) {
        results.push({ title: cleanTitle, snippet: cleanSnippet, url: rawUrl });
      }
    }
  }

  return results.slice(0, maxResults);
}

// 3. DuckDuckGo Instant Answer API (Final Fallback)
async function searchDDGApi(query: string): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

  const response = await fetchWithTimeout(url, {}, 1500);
  if (!response.ok) return [];

  const data = await response.json();
  const results: SearchResult[] = [];

  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.Heading || query,
      snippet: data.AbstractText,
      url: data.AbstractURL
    });
  }

  if (Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.slice(0, 60),
          snippet: topic.Text,
          url: topic.FirstURL
        });
      }
    }
  }

  return results.slice(0, 4);
}

// Main Search function with automatic fast fallback chain
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const cacheKey = getCacheKey(query);
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Search Cache Hit]", query);
    return cached.results;
  }

  console.log(`[DuckDuckGo Search] Searching: "${query}"`);

  // Fast Fallback Chain: DDG Lite -> DDG HTML -> DDG API
  let results: SearchResult[] = [];
  try {
    results = await searchDDGLite(query, maxResults);
  } catch (err) {
    console.warn("[DDG Lite Failed, trying DDG HTML]", err);
  }

  if (results.length === 0) {
    try {
      results = await searchDDGHTML(query, maxResults);
    } catch (err) {
      console.warn("[DDG HTML Failed, trying DDG API]", err);
    }
  }

  if (results.length === 0) {
    try {
      results = await searchDDGApi(query);
    } catch (err) {
      console.warn("[DDG API Failed]", err);
    }
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
  }

  console.log(`[DuckDuckGo Search] Returned ${results.length} results`);
  return results;
}

export function formatResultsForLLM(results: SearchResult[]): string {
  if (results.length === 0) return "";

  let formatted = "### DuckDuckGo Real-Time Web Search Results:\n\n";

  results.forEach((r, i) => {
    formatted += `[${i + 1}] ${r.title}\n`;
    formatted += `    ${r.snippet}\n`;
    formatted += `    Source: ${r.url}\n\n`;
  });

  return formatted.trim();
}
