import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { github_list_repositories } from "@/lib/github";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.userId },
  });

  if (!profile || !profile.githubConnected) {
    return NextResponse.json({
      connected: false,
      repos: [],
      message: "GitHub account is not connected.",
    });
  }

  try {
    const username = profile.githubUsername || user.username;
    const accessToken = profile.githubToken || null;
    const repos = await github_list_repositories(username || undefined, accessToken);
    return NextResponse.json({ connected: true, username, repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch repositories" }, { status: 500 });
  }
}
