import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listMCPServers } from "@/lib/mcp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let isGitHubConnected = false;
  let isGoogleConnected = false;
  let isMcpConnected = false;
  let ghUsername: string | null = null;
  let googleEmail: string | null = null;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });
    if (profile) {
      isGitHubConnected = Boolean(profile.githubConnected);
      isGoogleConnected = Boolean(profile.googleConnected);
      isMcpConnected = Boolean(profile.mcpConnected);
      ghUsername = profile.githubUsername;
      googleEmail = profile.googleEmail;
    }
  } catch (e) {
    console.warn("Integrations status DB check notice:", e);
  }

  const mcpServers = listMCPServers();

  const integrations = [
    {
      id: "github",
      name: "GitHub",
      icon: "Github",
      connected: isGitHubConnected,
      username: isGitHubConnected ? (ghUsername || user.username) : null,
    },
    {
      id: "drive",
      name: "Google Drive",
      icon: "HardDrive",
      connected: isGoogleConnected,
      username: isGoogleConnected ? (googleEmail || `${user.username}@gmail.com`) : null,
    },
    {
      id: "calendar",
      name: "Google Calendar",
      icon: "Calendar",
      connected: isGoogleConnected,
      username: isGoogleConnected ? (googleEmail || `${user.username}@gmail.com`) : null,
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: "Mail",
      connected: isGoogleConnected,
      username: isGoogleConnected ? (googleEmail || `${user.username}@gmail.com`) : null,
    },
    {
      id: "sheets",
      name: "Google Sheets",
      icon: "FileSpreadsheet",
      connected: isGoogleConnected,
      username: isGoogleConnected ? (googleEmail || `${user.username}@gmail.com`) : null,
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
      name: "Browser Agent",
      icon: "Globe",
      connected: false,
      details: "Not configured",
    },
  ];

  const activeToolsCount = integrations.filter(i => i.connected).length;

  return NextResponse.json({
    activeToolsCount,
    integrations,
  });
}
