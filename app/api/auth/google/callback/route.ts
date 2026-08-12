import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
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
