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

  try {
    let profile = null;
    if (user) {
      profile = await prisma.userProfile.findUnique({ where: { userId: user.userId } });
    }

    if (!profile) {
      const dbUser = await prisma.user.findFirst();
      if (dbUser) {
        profile = await prisma.userProfile.findUnique({ where: { userId: dbUser.id } });
      }
    }

    if (!profile) {
      profile = await prisma.userProfile.findFirst({
        where: { OR: [{ githubConnected: true }, { linkedinConnected: true }, { vercelConnected: true }] },
      });
    }

    if (profile) {
      isGitHubConnected = Boolean(profile.githubConnected);
      isLinkedInConnected = Boolean(profile.linkedinConnected);
      isVercelConnected = Boolean(profile.vercelConnected);
      isMcpConnected = Boolean(profile.mcpConnected);
      ghUsername = profile.githubUsername;
      liName = profile.linkedinName;
      vercelUsername = profile.vercelUsername;
    }

    // Check if any other profile in single-user dev environment has active integrations
    if (!isGitHubConnected) {
      const anyGh = await prisma.userProfile.findFirst({
        where: { githubConnected: true },
      });
      if (anyGh) {
        isGitHubConnected = true;
        ghUsername = anyGh.githubUsername;
      }
    }

    if (!isLinkedInConnected) {
      const anyLi = await prisma.userProfile.findFirst({
        where: { linkedinConnected: true },
      });
      if (anyLi) {
        isLinkedInConnected = true;
        liName = anyLi.linkedinName;
      }
    }

    if (!isVercelConnected) {
      const anyVercel = await prisma.userProfile.findFirst({
        where: { vercelConnected: true },
      });
      if (anyVercel) {
        isVercelConnected = true;
        vercelUsername = anyVercel.vercelUsername;
      }
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

