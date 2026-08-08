import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let isConnected = false;
  let ghUsername = null;
  let avatarUrl = null;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });
    if (profile && (profile as any).githubConnected) {
      isConnected = true;
      ghUsername = (profile as any).githubUsername || user.username;
      avatarUrl = (profile as any).githubAvatarUrl || `https://github.com/${ghUsername}.png`;
    }
  } catch (e) {
    console.error("Error fetching user profile github status:", e);
  }

  return NextResponse.json({
    connected: isConnected,
    username: isConnected ? ghUsername : null,
    displayName: isConnected ? ghUsername : null,
    avatarUrl: isConnected ? avatarUrl : null,
    profileUrl: isConnected ? `https://github.com/${ghUsername}` : null,
  });
}
