import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.userId },
  });

  const isConnected = Boolean(profile?.githubConnected);

  return NextResponse.json({
    connected: isConnected,
    username: isConnected ? (profile?.githubUsername || user.username) : null,
    displayName: isConnected ? (user.name || user.username) : null,
    avatarUrl: isConnected ? (profile?.githubAvatarUrl || `https://github.com/${profile?.githubUsername || user.username}.png`) : null,
    profileUrl: isConnected ? `https://github.com/${profile?.githubUsername || user.username}` : null,
  });
}
