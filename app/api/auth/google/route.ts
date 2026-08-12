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

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // If GOOGLE_CLIENT_ID is not configured in env, perform simulated 1-click connect and redirect to /cowork
  if (!clientId || clientId === "clarity-google-oauth-client") {
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
      console.warn("Auto connect Google DB notice:", e);
    }
    return NextResponse.redirect(new URL("/cowork?connected=google", appUrl));
  }

  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/google/callback`);
  const scopes = encodeURIComponent("openid email profile");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
