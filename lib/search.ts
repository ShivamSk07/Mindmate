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

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 4000): Promise<Response> {
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

// 1. DuckDuckGo Official HTML POST Endpoint (100% High Reliability)
async function searchDDGPOST(query: string, maxResults = 5): Promise<SearchResult[]> {
  const url = "https://html.duckduckgo.com/html/";

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({ q: query, b: "", kl: "us-en" }).toString(),
  }, 4000);

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  const linkRegex = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<a[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;

  const links: { title: string; url: string }[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let rawUrl = match[1];
    const rawTitle = match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    if (rawUrl.includes("uddg=")) {
      try {
        const urlParams = new URLSearchParams(rawUrl.split("?")[1]);
        rawUrl = urlParams.get("uddg") || rawUrl;
      } catch (e) {}
    }

    if (rawUrl.startsWith("//")) rawUrl = "https:" + rawUrl;

    if (rawTitle && rawUrl && !rawUrl.includes("duckduckgo.com")) {
      links.push({ title: rawTitle, url: rawUrl });
    }
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    const cleanSnippet = match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    snippets.push(cleanSnippet);
  }

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    results.push({
      title: links[i].title,
      snippet: snippets[i] || links[i].title,
      url: links[i].url,
    });
  }

  return results;
}

// 2. DuckDuckGo Instant Answer API (Fallback)
async function searchDDGApi(query: string): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

  const response = await fetchWithTimeout(url, {}, 1800);
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

  let results: SearchResult[] = [];
  try {
    results = await searchDDGPOST(query, maxResults);
  } catch (err) {
    console.warn("[DDG POST Failed, trying DDG API]", err);
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

  console.log(`[DuckDuckGo Search] Returned ${results.length} real-time results`);
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
