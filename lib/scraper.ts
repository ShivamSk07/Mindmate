/**
 * Live URL Scraper & Web Content Extractor
 * Fetches and parses live webpage content (LinkedIn, GitHub, articles, blogs, websites)
 * for injection into LLM prompt context.
 */

export interface ScrapedUrlContent {
  url: string;
  title: string;
  content: string;
  success: boolean;
}

export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"'()]+)/gi;
  const matches = text.match(urlRegex) || [];
  // Return unique URLs
  return Array.from(new Set(matches));
}

function cleanHtmlToText(html: string): { title: string; text: string } {
  let title = "";
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch) {
    title = titleMatch[1].replace(/[\r\n\t]+/g, " ").trim();
  }

  // Remove scripts, styles, iframes, svgs, noscripts
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Convert headings and paragraphs to structured text
  clean = clean
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n### $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n• $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n");

  // Strip remaining tags
  clean = clean.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // Compress multiple spaces and newlines
  clean = clean
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return {
    title: title || "Webpage Content",
    text: clean.slice(0, 4500), // Max ~4500 chars of high-value text
  };
}

export async function scrapeUrlContent(url: string, timeoutMs = 5000): Promise<ScrapedUrlContent> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        url,
        title: "",
        content: `Could not retrieve content (HTTP ${res.status}).`,
        success: false,
      };
    }

    const html = await res.text();
    const { title, text } = cleanHtmlToText(html);

    return {
      url,
      title,
      content: text,
      success: text.length > 50,
    };
  } catch (err: any) {
    console.warn(`[URL Scraper Error for ${url}]:`, err?.message || err);
    return {
      url,
      title: "",
      content: `Failed to scrape page: ${err?.message || "Connection timeout"}`,
      success: false,
    };
  }
}
