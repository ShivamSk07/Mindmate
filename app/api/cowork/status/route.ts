import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listMCPServers } from "@/lib/mcp";

export async function GET() {
  const user = await getSessionUser();

  let isGitHubConnected = false;
  let isLinkedInConnected = false;
  let isVercelConnected = false;
  let isMcpConnected = false;
  let ghUsername: string | null = null;
  let liName: string | null = null;
  let vercelUsername: string | null = null;

  let isCanvaConnected = false;
  let canvaName: string | null = null;

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        activeToolsCount: 1,
        integrations: [
          { id: "canva", name: "Canva", icon: "Palette", connected: false, username: null, details: "Design Generator & Autofill" },
          { id: "github", name: "GitHub", icon: "Github", connected: false, username: null },
          { id: "linkedin", name: "LinkedIn", icon: "Linkedin", connected: false, username: null },
          { id: "vercel", name: "Vercel", icon: "Triangle", connected: false, username: null },
          { id: "mcp", name: "MCP Servers", icon: "Plug", connected: false, details: "No MCP servers configured" },
          { id: "browser", name: "Web Search", icon: "Globe", connected: true, details: "Active" },
        ],
      },
      { status: 401 }
    );
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    if (profile) {
      isGitHubConnected = Boolean(profile.githubConnected && profile.githubToken);
      isLinkedInConnected = Boolean(profile.linkedinConnected && profile.linkedinToken);
      isVercelConnected = Boolean(profile.vercelConnected && profile.vercelToken);
      isMcpConnected = Boolean(profile.mcpConnected);
      isCanvaConnected = Boolean((profile as any).canvaConnected && (profile as any).canvaToken);
      ghUsername = isGitHubConnected ? profile.githubUsername : null;
      liName = isLinkedInConnected ? profile.linkedinName : null;
      vercelUsername = isVercelConnected ? profile.vercelUsername : null;
      canvaName = isCanvaConnected ? ((profile as any).canvaUserDisplayName || "Canva Account") : null;
    }
  } catch (e) {
    console.warn("Integrations status DB check notice:", e);
  }

  const mcpServers = listMCPServers();

  const integrations = [
    {
      id: "canva",
      name: "Canva",
      icon: "Palette",
      connected: isCanvaConnected,
      username: isCanvaConnected ? (canvaName || "Canva Workspace") : null,
      details: "Design Generator & Autofill",
    },
    {
      id: "github",
      name: "GitHub",
      icon: "Github",
      connected: isGitHubConnected,
      username: isGitHubConnected ? (ghUsername || user?.username || "GitHub Account") : null,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "Linkedin",
      connected: isLinkedInConnected,
      username: isLinkedInConnected ? (liName || user?.username || "LinkedIn User") : null,
    },
    {
      id: "vercel",
      name: "Vercel",
      icon: "Triangle",
      connected: isVercelConnected,
      username: isVercelConnected ? (vercelUsername || "Vercel Account") : null,
    },
    {
      id: "mcp",
      name: "MCP Servers",
      icon: "Plug",
      connected: isMcpConnected && mcpServers.length > 0,
      details: mcpServers.length > 0 ? `${mcpServers.length} server${mcpServers.length > 1 ? "s" : ""} configured` : "No MCP servers configured",
    },
    {
      id: "browser",
      name: "Web Search",
      icon: "Globe",
      connected: true,
      details: "Active",
    },
  ];

  const activeToolsCount = integrations.filter(i => i.connected).length;

  return NextResponse.json({
    activeToolsCount,
    integrations,
  });
}

