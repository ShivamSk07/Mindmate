import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, token, username } = body; // "connect" | "disconnect"

  if (action === "disconnect") {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        githubConnected: false,
        githubToken: null,
        githubUsername: null,
        githubAvatarUrl: null,
      },
      create: {
        userId: user.userId,
        githubConnected: false,
        githubToken: null,
        githubUsername: null,
        githubAvatarUrl: null,
      },
    });

    return NextResponse.json({
      connected: false,
      message: "GitHub account disconnected successfully.",
    });
  }

  // Connect GitHub for this specific user
  const ghUsername = username || user.username || "ShivamSk07";
  const avatarUrl = `https://github.com/${ghUsername}.png`;

  await prisma.userProfile.upsert({
    where: { userId: user.userId },
    update: {
      githubConnected: true,
      githubToken: token || null,
      githubUsername: ghUsername,
      githubAvatarUrl: avatarUrl,
    },
    create: {
      userId: user.userId,
      githubConnected: true,
      githubToken: token || null,
      githubUsername: ghUsername,
      githubAvatarUrl: avatarUrl,
    },
  });

  return NextResponse.json({
    connected: true,
    username: ghUsername,
    displayName: ghUsername,
    avatarUrl,
    profileUrl: `https://github.com/${ghUsername}`,
    message: "GitHub account connected successfully.",
  });
}
