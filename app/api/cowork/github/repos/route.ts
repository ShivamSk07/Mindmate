import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { github_list_repositories } from "@/lib/github";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ connected: false, repos: [], message: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.githubConnected || !profile.githubToken) {
      return NextResponse.json({
        connected: false,
        repos: [],
        message: "GitHub account is not connected.",
      });
    }

    const username = profile.githubUsername || undefined;
    const accessToken = profile.githubToken;
    const repos = await github_list_repositories(username, accessToken);
    return NextResponse.json({ connected: true, username: profile.githubUsername, repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch repositories" }, { status: 500 });
  }
}

