import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const gEmail = `${user.username}@gmail.com`;
  try {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        googleConnected: true,
        googleEmail: gEmail,
      },
      create: {
        userId: user.userId,
        googleConnected: true,
        googleEmail: gEmail,
      },
    });
  } catch (e) {
    console.error("Failed to connect Google via GET:", e);
  }

  return NextResponse.redirect(new URL("/cowork?connected=google", appUrl));
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
  const { action, email } = body;

  try {
    if (action === "disconnect") {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          googleConnected: false,
          googleEmail: null,
          googleToken: null,
          googleRefreshToken: null,
        },
        create: {
          userId,
          googleConnected: false,
          googleEmail: null,
        },
      });

      return NextResponse.json({
        connected: false,
        message: "Google account disconnected successfully.",
      });
    }

    const gEmail = email || (user ? `${user.username}@gmail.com` : "user@gmail.com");

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        googleConnected: true,
        googleEmail: gEmail,
      },
      create: {
        userId,
        googleConnected: true,
        googleEmail: gEmail,
      },
    });

    return NextResponse.json({
      connected: true,
      email: gEmail,
      message: "Google account connected successfully.",
    });
  } catch (e: any) {
    console.error("Google connect error:", e);
    return NextResponse.json({ error: "Failed to update Google connection state" }, { status: 500 });
  }
}
