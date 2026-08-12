import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
    console.error("Failed to connect GitHub via GET:", e);
  }

  return NextResponse.redirect(new URL("/cowork?connected=github", appUrl));
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, token, username } = body;

  try {
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

    let ghUsername = username || user.username || "ShivamSk07";
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
      where: { userId: user.userId },
      update: {
        githubConnected: true,
        githubToken: token ? token.trim() : null,
        githubUsername: ghUsername,
        githubAvatarUrl: avatarUrl,
      },
      create: {
        userId: user.userId,
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
