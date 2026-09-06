import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
      return NextResponse.json({ connected: false });
    }

    const ghUsername = profile.githubUsername || user?.username || "GitHub User";
    const avatarUrl = profile.githubAvatarUrl || `https://github.com/${ghUsername}.png`;

    return NextResponse.json({
      connected: true,
      username: ghUsername,
      displayName: ghUsername,
      avatarUrl,
      profileUrl: `https://github.com/${ghUsername}`,
    });
  } catch (error: any) {
    console.error("[GitHub Status Error]", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}

