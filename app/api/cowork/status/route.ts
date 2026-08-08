import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listMCPServers } from "@/lib/mcp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.userId },
  });

  const isGitHubConnected = Boolean(profile?.githubConnected);
  const mcpServers = listMCPServers();

  return NextResponse.json({
    activeToolsCount: 7,
    integrations: [
      {
        id: "github",
        name: "GitHub",
        icon: "Github",
        connected: isGitHubConnected,
        username: isGitHubConnected ? (profile?.githubUsername || user.username) : null,
      },
      {
        id: "drive",
        name: "Google Drive",
        icon: "HardDrive",
        connected: true,
        username: "shivam@clarity.app",
      },
      {
        id: "calendar",
        name: "Google Calendar",
        icon: "Calendar",
        connected: true,
        username: "shivam@clarity.app",
      },
      {
        id: "gmail",
        name: "Gmail",
        icon: "Mail",
        connected: true,
        username: "shivam@clarity.app",
      },
      {
        id: "sheets",
        name: "Google Sheets",
        icon: "FileSpreadsheet",
        connected: true,
        username: "shivam@clarity.app",
      },
      {
        id: "mcp",
        name: "MCP Servers",
        icon: "Plug",
        connected: true,
        details: `${mcpServers.length} servers connected`,
      },
      {
        id: "browser",
        name: "Browser Agent",
        icon: "Globe",
        connected: true,
        details: "Ready (Server-side Session)",
      },
    ],
  });
}
