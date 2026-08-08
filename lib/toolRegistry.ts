/**
 * Unified Tool Registry for Clarity CoWork
 * Registers tools across GitHub, Google Drive, Calendar, Gmail, Sheets, MCP, and Browser Agent.
 */

export interface ToolDefinition {
  name: string;
  category: "github" | "drive" | "calendar" | "gmail" | "sheets" | "mcp" | "browser";
  description: string;
  type: "read" | "write";
}

export const UNIFIED_TOOL_REGISTRY: ToolDefinition[] = [
  // GitHub
  { name: "github_list_repositories", category: "github", description: "List connected GitHub repositories", type: "read" },
  { name: "github_get_repository_tree", category: "github", description: "Get source file tree of repository", type: "read" },
  { name: "github_get_file", category: "github", description: "Read file contents from repository", type: "read" },
  { name: "github_search_code", category: "github", description: "Search code in repository", type: "read" },
  { name: "github_get_commits", category: "github", description: "List recent commits", type: "read" },
  { name: "github_get_issues", category: "github", description: "List repository issues", type: "read" },
  { name: "github_get_pull_requests", category: "github", description: "List pull requests", type: "read" },
  { name: "github_create_issue", category: "github", description: "Create new GitHub issue", type: "write" },
  { name: "github_create_branch", category: "github", description: "Create new branch", type: "write" },
  { name: "github_create_pull_request", category: "github", description: "Create new pull request", type: "write" },

  // Google Drive
  { name: "drive_search_files", category: "drive", description: "Search files in Google Drive", type: "read" },
  { name: "drive_get_file_content", category: "drive", description: "Read content of a Google Drive document", type: "read" },

  // Google Calendar
  { name: "calendar_list_events", category: "calendar", description: "List calendar events", type: "read" },
  { name: "calendar_find_free_time", category: "calendar", description: "Find available free time slots", type: "read" },
  { name: "calendar_create_event", category: "calendar", description: "Create new calendar event", type: "write" },

  // Gmail
  { name: "gmail_search", category: "gmail", description: "Search user emails", type: "read" },
  { name: "gmail_create_draft", category: "gmail", description: "Create an email draft", type: "read" },
  { name: "gmail_send", category: "gmail", description: "Send an email to a recipient", type: "write" },

  // Google Sheets
  { name: "sheets_read", category: "sheets", description: "Read dataset rows from Google Sheet", type: "read" },
  { name: "sheets_write", category: "sheets", description: "Write/modify dataset in Google Sheet", type: "write" },

  // MCP
  { name: "mcp_stitch_create_project", category: "mcp", description: "Execute MCP tool to create UI project", type: "write" },
  { name: "mcp_custom_run_pipeline", category: "mcp", description: "Execute MCP build pipeline", type: "write" },

  // Browser Agent
  { name: "browser_open", category: "browser", description: "Open URL in Browser Agent", type: "read" },
  { name: "browser_search", category: "browser", description: "Search documentation via Browser Agent", type: "read" },
  { name: "browser_extract", category: "browser", description: "Extract content from web page", type: "read" },
];

export function getToolDefinition(name: string): ToolDefinition | undefined {
  return UNIFIED_TOOL_REGISTRY.find(t => t.name === name);
}

export function requiresHumanApproval(toolName: string): boolean {
  const tool = getToolDefinition(toolName);
  return tool ? tool.type === "write" : false;
}
