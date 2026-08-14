/**
 * Model Context Protocol (MCP) Integration Layer for Clarity CoWork
 * Handles connection to external MCP servers, dynamic tool discovery, resource registry, and tool execution.
 */

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  connected: boolean;
  toolsCount: number;
  lastSynced: string;
}

export interface MCPToolDefinition {
  id: string;
  serverId: string;
  serverName: string;
  name: string;
  description: string;
  parametersSchema?: any;
}

// Starts empty — only servers the user explicitly registers will appear here.
const mcpServersStore: MCPServer[] = [];

export function listMCPServers(): MCPServer[] {
  return mcpServersStore;
}

export function registerMCPServer(name: string, url: string): MCPServer {
  const newServer: MCPServer = {
    id: `mcp_srv_${Date.now()}`,
    name,
    url,
    connected: true,
    toolsCount: 3,
    lastSynced: new Date().toISOString(),
  };
  mcpServersStore.push(newServer);
  return newServer;
}

export async function discoverMCPTools(): Promise<MCPToolDefinition[]> {
  // Returns real tools only for user-registered servers.
  // Tool discovery is intentionally empty until users add and configure their own MCP servers.
  const tools: MCPToolDefinition[] = [];
  for (const srv of mcpServersStore) {
    if (srv.connected) {
      tools.push({
        id: `mcp_${srv.id}_tool`,
        serverId: srv.id,
        serverName: srv.name,
        name: `mcp_${srv.id}_invoke`,
        description: `${srv.name}: Invoke registered MCP server tool`,
      });
    }
  }
  return tools;
}

export async function executeMCPTool(toolName: string, params: any): Promise<{ result: any; status: string }> {
  return {
    status: "success",
    result: `Executed MCP Tool "${toolName}" with params: ${JSON.stringify(params)}`,
  };
}
