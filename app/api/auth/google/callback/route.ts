import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
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
    console.error("Failed to update UserProfile on Google OAuth callback:", e);
  }

  return NextResponse.redirect(new URL("/cowork?connected=google", appUrl));
}
