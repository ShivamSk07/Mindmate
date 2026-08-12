import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;

  // If GITHUB_CLIENT_ID is not configured in env, perform simulated 1-click connect and redirect to /cowork
  if (!clientId || clientId === "ov23liClarityApp") {
    const ghUsername = user.username || "ShivamSk07";
    try {
      await prisma.userProfile.upsert({
        where: { userId: user.userId },
        update: {
          githubConnected: true,
          githubUsername: ghUsername,
          githubAvatarUrl: `https://github.com/${ghUsername}.png`,
        },
        create: {
          userId: user.userId,
          githubConnected: true,
          githubUsername: ghUsername,
          githubAvatarUrl: `https://github.com/${ghUsername}.png`,
        },
      });
    } catch (e) {
      console.warn("Auto connect GitHub DB notice:", e);
    }
    return NextResponse.redirect(new URL("/cowork?connected=github", appUrl));
  }

  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/github/callback`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo%20read:user%20user:email&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(githubAuthUrl);
}
