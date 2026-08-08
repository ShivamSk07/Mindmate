export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  engine?: string;
}

const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 3500): Promise<Response> {
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

// -------------------------------------------------------------
// 1. DuckDuckGo Official HTML POST Endpoint
// -------------------------------------------------------------
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
  }, 3500);

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
      engine: "DuckDuckGo"
    });
  }

  return results;
}

// -------------------------------------------------------------
// 2. Bing Web HTML Scraping (High Accuracy for Live Events & Sports)
// -------------------------------------------------------------
async function searchBing(query: string, maxResults = 5): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${encodedQuery}&setlang=en-us`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    }
  }, 3500);

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  // Match Bing result items <li class="b_algo">...</li>
  const algoRegex = /<li[^>]*class=["'][^"']*b_algo[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = algoRegex.exec(html)) !== null) {
    const block = match[1];

    // Extract Title and URL from <h2><a href="...">
    const h2Match = /<h2[^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!h2Match) continue;

    let href = h2Match[1];
    const title = h2Match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    // Extract Snippet from <p> or <div class="b_caption">
    const pMatch = /<(?:p|div)[^>]*class=["'][^"']*(?:b_caption|b_line|b_algoSnippet|b_parsenip)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i.exec(block) 
      || /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);

    const snippet = pMatch 
      ? pMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() 
      : title;

    if (title && href && !href.includes("bing.com") && !href.includes("microsoft.com")) {
      results.push({
        title,
        snippet,
        url: href,
        engine: "Bing"
      });
    }

    if (results.length >= maxResults) break;
  }

  return results;
}

// -------------------------------------------------------------
// 3. Google News RSS Feed (Official Free XML Feed — Zero Rate Limit)
// -------------------------------------------------------------
async function searchGoogleNewsRSS(query: string, maxResults = 5): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml",
    }
  }, 3500);

  if (!response.ok) return [];

  const xml = await response.text();
  const results: SearchResult[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemBlock = match[1];

    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemBlock);
    const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemBlock);
    const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemBlock);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemBlock);

    const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    const rawLink = linkMatch ? linkMatch[1].trim() : "";
    let rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim() : "";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

    if (pubDate) {
      rawDesc = `[Date: ${pubDate}] ${rawDesc}`;
    }

    if (rawTitle && rawLink) {
      results.push({
        title: rawTitle,
        snippet: rawDesc || rawTitle,
        url: rawLink,
        engine: "Google News"
      });
    }

    if (results.length >= maxResults) break;
  }

  return results;
}

// -------------------------------------------------------------
// 4. Wikipedia REST API (Official Free Factual Endpoint)
// -------------------------------------------------------------
async function searchWikipedia(query: string, maxResults = 3): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&utf8=&format=json&origin=*`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "MindMateBot/1.0 (https://mindmate.app)",
      "Accept": "application/json"
    }
  }, 2500);

  if (!response.ok) return [];

  const data = await response.json();
  const searchItems = data?.query?.search;
  if (!Array.isArray(searchItems) || searchItems.length === 0) return [];

  return searchItems.slice(0, maxResults).map((item: any) => ({
    title: item.title,
    snippet: item.snippet ? item.snippet.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : item.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
    engine: "Wikipedia"
  }));
}

// -------------------------------------------------------------
// MAIN MULTI-ENGINE SEARCH FUNCTION
// Waterfall Execution: DDG -> Bing -> Google News -> Wikipedia
// -------------------------------------------------------------
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  const cacheKey = getCacheKey(query);
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Search Cache Hit]", query);
    return cached.results;
  }

  console.log(`[Multi-Engine Search] Query: "${query}"`);

  let results: SearchResult[] = [];

  // Engine 1: DuckDuckGo HTML
  try {
    results = await searchDDGPOST(query, maxResults);
    if (results.length > 0) {
      console.log(`[Multi-Engine Search] Engine: DuckDuckGo (${results.length} results)`);
    }
  } catch (err) {
    console.warn("[Multi-Engine Search] DuckDuckGo failed, trying Bing...", err);
  }

  // Engine 2: Bing Web Scraping (Fallback if DDG returns 0)
  if (results.length === 0) {
    try {
      results = await searchBing(query, maxResults);
      if (results.length > 0) {
        console.log(`[Multi-Engine Search] Engine: Bing (${results.length} results)`);
      }
    } catch (err) {
      console.warn("[Multi-Engine Search] Bing failed, trying Google News...", err);
    }
  }

  // Engine 3: Google News RSS (Fallback for live news / sports)
  if (results.length === 0) {
    try {
      results = await searchGoogleNewsRSS(query, maxResults);
      if (results.length > 0) {
        console.log(`[Multi-Engine Search] Engine: Google News (${results.length} results)`);
      }
    } catch (err) {
      console.warn("[Multi-Engine Search] Google News failed, trying Wikipedia...", err);
    }
  }

  // Engine 4: Wikipedia REST API (Final Fallback for factual entity lookups)
  if (results.length === 0) {
    try {
      results = await searchWikipedia(query, maxResults);
      if (results.length > 0) {
        console.log(`[Multi-Engine Search] Engine: Wikipedia (${results.length} results)`);
      }
    } catch (err) {
      console.warn("[Multi-Engine Search] Wikipedia failed", err);
    }
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
  } else {
    console.log("[Multi-Engine Search] All engines returned 0 results.");
  }

  return results;
}

export function formatResultsForLLM(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const engineName = results[0]?.engine || "Real-Time Web";
  let formatted = `### ${engineName} Search Results:\n\n`;

  results.forEach((r, i) => {
    formatted += `[${i + 1}] ${r.title}\n`;
    formatted += `    ${r.snippet}\n`;
    formatted += `    Source: ${r.url}\n\n`;
  });

  return formatted.trim();
}
