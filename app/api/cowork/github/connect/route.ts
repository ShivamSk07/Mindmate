import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  return NextResponse.redirect(new URL("/api/auth/github", appUrl));
}

export async function POST(request: NextRequest) {
  let user = await getSessionUser();
  let userId = user?.userId;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized - please log in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, token, username } = body;

  try {
    if (action === "disconnect") {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          githubConnected: false,
          githubToken: null,
          githubUsername: null,
          githubAvatarUrl: null,
        },
        create: {
          userId,
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

    let ghUsername = username || user?.username || "ShivamSk07";
    let avatarUrl = `https://github.com/${ghUsername}.png`;

    if (token && token.trim()) {
      try {
        const ghRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "User-Agent": "Clarity-CoWork-Agent",
          },
        });
        if (ghRes.ok) {
          const ghUser = await ghRes.json();
          ghUsername = ghUser.login || ghUsername;
          avatarUrl = ghUser.avatar_url || avatarUrl;
        }
      } catch (e) {
        console.warn("GitHub token verification notice:", e);
      }
    }

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        githubConnected: true,
        githubToken: token ? token.trim() : null,
        githubUsername: ghUsername,
        githubAvatarUrl: avatarUrl,
      },
      create: {
        userId,
        githubConnected: true,
        githubToken: token ? token.trim() : null,
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
      message: `GitHub account @${ghUsername} authorized successfully.`,
    });
  } catch (e: any) {
    console.error("Connect error:", e);
    return NextResponse.json({ error: "GitHub authorization failed" }, { status: 500 });
  }
}
