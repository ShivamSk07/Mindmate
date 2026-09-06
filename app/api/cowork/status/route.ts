import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listMCPServers } from "@/lib/mcp";

export async function GET() {
  const user = await getSessionUser();

  let isGitHubConnected = false;
  let isLinkedInConnected = false;
  let isMcpConnected = false;
  let ghUsername: string | null = null;
  let liName: string | null = null;

  try {
    const profile = user
      ? await prisma.userProfile.findUnique({ where: { userId: user.userId } })
      : await prisma.userProfile.findFirst({
          where: { OR: [{ githubConnected: true }, { linkedinConnected: true }] },
        });

    if (profile) {
      isGitHubConnected = Boolean(profile.githubConnected);
      isLinkedInConnected = Boolean(profile.linkedinConnected);
      isMcpConnected = Boolean(profile.mcpConnected);
      ghUsername = profile.githubUsername;
      liName = profile.linkedinName;
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
