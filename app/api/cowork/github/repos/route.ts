import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { github_list_repositories } from "@/lib/github";

export async function GET() {
  try {
    const user = await getSessionUser();
    let profile = null;

    if (user) {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId },
      });
    }

    if (!profile || !profile.githubConnected) {
      profile = await prisma.userProfile.findFirst({
        where: { githubConnected: true },
      });
    }

    if (!profile || !profile.githubConnected) {
      return NextResponse.json({
        connected: false,
        repos: [],
        message: "GitHub account is not connected.",
      });
    }

    const username = profile.githubUsername || user?.username || "ShivamSk07";
    const accessToken = profile.githubToken || null;
    const repos = await github_list_repositories(username || undefined, accessToken);
    return NextResponse.json({ connected: true, username, repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch repositories" }, { status: 500 });
  }
}

