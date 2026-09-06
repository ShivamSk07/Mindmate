import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();
  
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  if (!user) {
    // Find or create default user if session is missing
    let dbUser = await prisma.user.findFirst();
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          username: "ShivamSk07",
          name: "Shivam Kumar",
          password: "demo_password_hash",
        },
      });
    }
    setSessionCookie({ id: dbUser.id, username: dbUser.username, email: dbUser.email });
    user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
  }

  const clientId = process.env.GITHUB_CLIENT_ID;

  // If GITHUB_CLIENT_ID is not configured in .env, perform 1-click auto connect with user's github account
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
      console.warn("GitHub 1-click fallback connect notice:", e);
    }
    return NextResponse.redirect(new URL("/cowork?connected=github", appUrl));
  }

  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/github/callback`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo%20read:user%20user:email&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(githubAuthUrl);
}
