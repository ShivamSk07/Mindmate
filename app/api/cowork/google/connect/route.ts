import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, email } = body;

  try {
    if (action === "disconnect") {
      await prisma.userProfile.upsert({
        where: { userId: user.userId },
        update: {
          googleConnected: false,
          googleEmail: null,
        },
        create: {
          userId: user.userId,
          googleConnected: false,
          googleEmail: null,
        },
      });

      return NextResponse.json({
        connected: false,
        message: "Google account disconnected successfully.",
      });
    }

    const gEmail = email || `${user.username}@gmail.com`;

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
