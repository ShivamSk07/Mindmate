import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vercel_get_user } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  return NextResponse.redirect(new URL("/api/auth/vercel", appUrl));
}

export async function POST(request: NextRequest) {
  try {
    let user = await getSessionUser();
    let userId = user?.userId;

    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, token } = body;

    if (action === "disconnect") {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          vercelConnected: false,
          vercelToken: null,
          vercelUsername: null,
          vercelAvatarUrl: null,
          vercelTeamId: null,
        },
        create: {
          userId,
          vercelConnected: false,
          vercelToken: null,
          vercelUsername: null,
          vercelAvatarUrl: null,
          vercelTeamId: null,
        },
      });

      return NextResponse.json({
        connected: false,
        message: "Vercel account disconnected successfully.",
      });
    }

    if (!token || !token.trim()) {
      return NextResponse.json({ error: "Vercel token is required" }, { status: 400 });
    }

    // Verify token with Vercel API
    const vercelUser = await vercel_get_user(token.trim());
    if (!vercelUser) {
      return NextResponse.json(
        { error: "Invalid Vercel token. Please check your Personal Access Token in Vercel Account Settings." },
        { status: 400 }
      );
    }

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        vercelConnected: true,
        vercelToken: token.trim(),
        vercelUsername: vercelUser.username,
        vercelAvatarUrl: vercelUser.avatar || null,
      },
      create: {
        userId,
        vercelConnected: true,
        vercelToken: token.trim(),
        vercelUsername: vercelUser.username,
        vercelAvatarUrl: vercelUser.avatar || null,
      },
    });

    return NextResponse.json({
      connected: true,
      username: vercelUser.username,
      name: vercelUser.name,
      avatarUrl: vercelUser.avatar,
      message: `Vercel account @${vercelUser.username} connected successfully.`,
    });
  } catch (error: any) {
    console.error("[Vercel Connect Route Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
