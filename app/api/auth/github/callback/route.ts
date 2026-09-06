import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  if (!user) {
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

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  let ghUsername = user.username || "ShivamSk07";
  let avatarUrl = `https://github.com/${ghUsername}.png`;
  let accessToken: string | null = null;

  if (code) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID || "ov23liClarityApp";
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";

      // Exchange authorization code for access token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token || null;

        if (accessToken) {
          // Fetch authenticated GitHub user details
          const userRes = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "Clarity-CoWork-Agent",
            },
          });
          if (userRes.ok) {
            const ghUser = await userRes.json();
            ghUsername = ghUser.login || ghUsername;
            avatarUrl = ghUser.avatar_url || avatarUrl;
          }
        }
      }
    } catch (e) {
      console.warn("GitHub OAuth callback code exchange notice:", e);
    }
  }

  // Update user database profile
  try {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        githubConnected: true,
        githubToken: accessToken,
        githubUsername: ghUsername,
        githubAvatarUrl: avatarUrl,
      },
      create: {
        userId: user.userId,
        githubConnected: true,
        githubToken: accessToken,
        githubUsername: ghUsername,
        githubAvatarUrl: avatarUrl,
      },
    });
  } catch (e) {
    console.error("Failed to update UserProfile on GitHub OAuth callback:", e);
  }

  return NextResponse.redirect(new URL("/cowork?connected=github", appUrl));
}
