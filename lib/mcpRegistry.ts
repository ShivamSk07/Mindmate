/**
 * Supported MCP Server Registry & Control Layer for Clarity CoWork
 * Defines supported MCP servers, @mention tags, configuration schemas, and dynamic routing.
 */

export interface SupportedMCPServer {
  id: string;
  tag: string; // e.g. "@stitch", "@postgres"
  name: string;
  category: "UI Design" | "Database" | "Codebase" | "Web Search" | "Memory" | "Communication" | "Productivity";
  description: string;
  icon: string;
  defaultUrl: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder?: string;
  supportedTools: { name: string; description: string }[];
  isConfigured: boolean;
  enabled: boolean;
  apiKey?: string;
  customUrl?: string;
}

export const SUPPORTED_MCP_REGISTRY: SupportedMCPServer[] = [
  {
    id: "stitch",
    tag: "@stitch",
    name: "Stitch UI Generator MCP",
    category: "UI Design",
    description: "Generate UI layouts, design variants, and modern component systems from prompt specs.",
    icon: "🎨",
    defaultUrl: "https://mcp.stitch.dev/v1",
    requiresApiKey: true,
    apiKeyPlaceholder: "st_live_xxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "generate_screen_from_text", description: "Generate new UI screen layout from text prompt" },
      { name: "edit_screens", description: "Modify existing UI components and colors" },
      { name: "generate_variants", description: "Create 3 design variants of an existing layout" },
      { name: "create_design_system", description: "Build theme tokens and typography rules" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "postgres",
    tag: "@postgres",
    name: "PostgreSQL Database MCP",
    category: "Database",
    description: "Inspect database schemas, execute read queries, check indexes, and analyze row counts.",
    icon: "🗄️",
    defaultUrl: "postgresql://neondb_owner:...@ep-pooler.neon.tech/neondb",
    requiresApiKey: true,
    apiKeyPlaceholder: "postgresql://user:pass@host/db",
    supportedTools: [
      { name: "db_list_tables", description: "List all public tables and row count metrics" },
      { name: "db_get_schema", description: "Fetch detailed table DDL and foreign keys" },
      { name: "db_execute_query", description: "Run read-only SQL queries with safety limits" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "github",
    tag: "@github",
    name: "GitHub Enterprise MCP",
    category: "Codebase",
    description: "Deep codebase tree inspection, commit history search, PR reviews, and issue tracking.",
    icon: "🐙",
    defaultUrl: "https://api.github.com",
    requiresApiKey: true,
    apiKeyPlaceholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "github_get_repository_tree", description: "Recursively scan repository file tree" },
      { name: "github_search_code", description: "Search exact code symbols and functions" },
      { name: "github_get_commits", description: "Retrieve recent commit logs and diffs" },
      { name: "github_create_issue", description: "Open new GitHub issue with task report" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "browser",
    tag: "@browser",
    name: "Web Browser Agent MCP",
    category: "Web Search",
    description: "Live web search, public page text extraction, and real-time documentation scraping.",
    icon: "🌐",
    defaultUrl: "https://browser.mcp.clarity.app",
    requiresApiKey: false,
    supportedTools: [
      { name: "browser_search", description: "Perform live Google web search with summary citations" },
      { name: "browser_extract", description: "Scrape and convert public webpage content to Markdown" },
      { name: "browser_open", description: "Navigate and inspect DOM structure" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "memory",
    tag: "@memory",
    name: "Memory Vault MCP",
    category: "Memory",
    description: "Access long-term user preferences, past project context, and custom persona memory.",
    icon: "🧠",
    defaultUrl: "https://memory.mcp.clarity.app",
    requiresApiKey: false,
    supportedTools: [
      { name: "memory_search", description: "Search vector memory vault for past conversation context" },
      { name: "memory_save", description: "Persist key user facts and preferences" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "slack",
    tag: "@slack",
    name: "Slack Enterprise MCP",
    category: "Communication",
    description: "Send workspace channel notifications, summarize discussion threads, and draft updates.",
    icon: "💬",
    defaultUrl: "https://slack.com/api/mcp",
    requiresApiKey: true,
    apiKeyPlaceholder: "xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx",
    supportedTools: [
      { name: "slack_post_message", description: "Send message to target Slack channel" },
      { name: "slack_get_history", description: "Fetch recent channel discussion messages" },
    ],
    isConfigured: false,
    enabled: false,
  },
  {
    id: "notion",
    tag: "@notion",
    name: "Notion Workspace MCP",
    category: "Productivity",
    description: "Search workspace Notion pages, extract knowledge base documents, and read team wikis.",
    icon: "📝",
    defaultUrl: "https://api.notion.com/v1/mcp",
    requiresApiKey: true,
    apiKeyPlaceholder: "secret_xxxxxxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "notion_search_pages", description: "Search Notion database pages and team wikis" },
      { name: "notion_get_page_content", description: "Extract block content from Notion page" },
    ],
    isConfigured: false,
    enabled: false,
  },
];

export function getSupportedMCPRegistry(): SupportedMCPServer[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("clarity_mcp_registry_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return SUPPORTED_MCP_REGISTRY.map(defaultItem => {
          const found = parsed.find((p: any) => p.id === defaultItem.id);
          return found ? { ...defaultItem, ...found } : defaultItem;
        });
      } catch (e) {
        console.warn("Failed to load saved MCP registry:", e);
      }
    }
  }
  return SUPPORTED_MCP_REGISTRY;
}

export function saveMCPRegistry(registry: SupportedMCPServer[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("clarity_mcp_registry_v1", JSON.stringify(registry));
  }
}

export function parseMentionedMCPServers(query: string): SupportedMCPServer[] {
  const registry = getSupportedMCPRegistry();
  const activeTags = registry.filter(s => s.enabled);
  return activeTags.filter(s => query.toLowerCase().includes(s.tag.toLowerCase()));
}
