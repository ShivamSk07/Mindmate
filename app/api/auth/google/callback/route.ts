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

  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let googleEmail: string = `${user.username}@gmail.com`;

  if (code) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const redirectUri = `${appUrl}/api/auth/google/callback`;

      // Exchange authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token || null;
        refreshToken = tokenData.refresh_token || null;

        if (accessToken) {
          // Fetch real user email from Google userinfo API
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json();
            googleEmail = userInfo.email || googleEmail;
          }
        }
      } else {
        const errData = await tokenRes.json();
        console.error("Google token exchange error:", errData);
      }
    } catch (e) {
      console.error("Google OAuth callback code exchange error:", e);
    }
  }

  // Save real token, refresh token and email to DB
  try {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        googleConnected: true,
        googleEmail,
        googleToken: accessToken,
        googleRefreshToken: refreshToken,
      },
      create: {
        userId: user.userId,
        googleConnected: true,
        googleEmail,
        googleToken: accessToken,
        googleRefreshToken: refreshToken,
      },
    });
  } catch (e) {
    console.error("Failed to update UserProfile on Google OAuth callback:", e);
  }

  return NextResponse.redirect(new URL("/cowork?connected=google", appUrl));
}
