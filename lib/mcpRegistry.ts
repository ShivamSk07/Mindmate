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
    name: "Stitch UI MCP",
    category: "UI Design",
    description: "Generate UI layouts, component systems, and design tokens.",
    defaultUrl: "https://mcp.stitch.dev/v1",
    requiresApiKey: true,
    apiKeyPlaceholder: "st_live_xxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "generate_screen_from_text", description: "Generate new UI layout from prompt" },
      { name: "edit_screens", description: "Modify existing UI components" },
      { name: "generate_variants", description: "Create design variants" },
      { name: "create_design_system", description: "Build theme tokens" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "postgres",
    tag: "@postgres",
    name: "PostgreSQL MCP",
    category: "Database",
    description: "Inspect DB schemas, foreign keys, and run read-only queries.",
    defaultUrl: "postgresql://neondb_owner:...@ep-pooler.neon.tech/neondb",
    requiresApiKey: true,
    apiKeyPlaceholder: "postgresql://user:pass@host/db",
    supportedTools: [
      { name: "db_list_tables", description: "List tables and row counts" },
      { name: "db_get_schema", description: "Fetch table DDL" },
      { name: "db_execute_query", description: "Run read-only SQL query" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "github",
    tag: "@github",
    name: "GitHub Enterprise MCP",
    category: "Codebase",
    description: "Inspect codebase file tree, search code symbols, and review PRs.",
    defaultUrl: "https://api.github.com",
    requiresApiKey: true,
    apiKeyPlaceholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "github_get_repository_tree", description: "Scan file tree" },
      { name: "github_search_code", description: "Search exact code symbols" },
      { name: "github_get_commits", description: "Retrieve recent commit diffs" },
      { name: "github_create_issue", description: "Open GitHub issue" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "browser",
    tag: "@browser",
    name: "Web Browser Agent MCP",
    category: "Web Search",
    description: "Live web search, public page scraping, and documentation extraction.",
    defaultUrl: "https://browser.mcp.clarity.app",
    requiresApiKey: false,
    supportedTools: [
      { name: "browser_search", description: "Live web search with citations" },
      { name: "browser_extract", description: "Convert webpage to Markdown" },
      { name: "browser_open", description: "Navigate and inspect DOM" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "memory",
    tag: "@memory",
    name: "Memory Vault MCP",
    category: "Memory",
    description: "Access long-term user preferences, project context, and past facts.",
    defaultUrl: "https://memory.mcp.clarity.app",
    requiresApiKey: false,
    supportedTools: [
      { name: "memory_search", description: "Search vector memory vault" },
      { name: "memory_save", description: "Persist key user facts" },
    ],
    isConfigured: true,
    enabled: true,
  },
  {
    id: "slack",
    tag: "@slack",
    name: "Slack MCP",
    category: "Communication",
    description: "Send channel messages and summarize discussion threads.",
    defaultUrl: "https://slack.com/api/mcp",
    requiresApiKey: true,
    apiKeyPlaceholder: "xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx",
    supportedTools: [
      { name: "slack_post_message", description: "Send Slack message" },
      { name: "slack_get_history", description: "Fetch discussion history" },
    ],
    isConfigured: false,
    enabled: false,
  },
  {
    id: "notion",
    tag: "@notion",
    name: "Notion MCP",
    category: "Productivity",
    description: "Search workspace Notion pages and extract team wiki docs.",
    defaultUrl: "https://api.notion.com/v1/mcp",
    requiresApiKey: true,
    apiKeyPlaceholder: "secret_xxxxxxxxxxxxxxxxxxxx",
    supportedTools: [
      { name: "notion_search_pages", description: "Search Notion database pages" },
      { name: "notion_get_page_content", description: "Extract Notion page blocks" },
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
