import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state");

  let stateUserId: string | null = null;
  let codeVerifier: string | null = null;
  if (rawState) {
    try {
      const parsed = JSON.parse(Buffer.from(rawState, "base64url").toString("utf-8"));
      if (parsed.userId) stateUserId = parsed.userId;
      if (parsed.codeVerifier) codeVerifier = parsed.codeVerifier;
    } catch {}
  }

  if (!user && stateUserId) {
    const dbUser = await prisma.user.findUnique({ where: { id: stateUserId } });
    if (dbUser) {
      user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
    }
  }

  if (!user) {
    let dbUser = await prisma.user.findFirst();
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          username: "user",
          name: "User",
          password: "demo_password_hash",
        },
      });
    }
    user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
  }

  const sendRedirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, appUrl));
    if (user) {
      const token = signJwt({ userId: user.userId, username: user.username, email: user.email });
      response.cookies.set("mindmate_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    return response;
  };

  if (error || !code) {
    return sendRedirect(`/cowork?error=${encodeURIComponent(error || "Canva authorization failed")}`);
  }

  const clientId = process.env.CANVA_CLIENT_ID || process.env.NEXT_PUBLIC_CANVA_CLIENT_ID || "OC-AaDoY4HR7fJE";
  const clientSecret = process.env.CANVA_CLIENT_SECRET || "";
  const redirectUri = `${appUrl}/api/auth/canva/callback`;

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code_verifier: codeVerifier || "",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.text();
      console.error("[Canva OAuth] Token exchange error:", errData);
      return sendRedirect(`/cowork?error=Token exchange failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Get user profile if possible
    let displayName = "Canva Account";
    try {
      const userRes = await fetch("https://api.canva.com/rest/v1/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const uData = await userRes.json();
        displayName = uData.user?.display_name || displayName;
      }
    } catch {}

    await (prisma.userProfile as any).upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        canvaConnected: true,
        canvaToken: accessToken,
        canvaRefreshToken: refreshToken,
        canvaUserDisplayName: displayName,
      },
      update: {
        canvaConnected: true,
        canvaToken: accessToken,
        canvaRefreshToken: refreshToken,
        canvaUserDisplayName: displayName,
      },
    });

    return sendRedirect("/cowork?connected=canva");
  } catch (err: any) {
    console.error("[Canva OAuth] Unexpected error:", err);
    return sendRedirect(`/cowork?error=${encodeURIComponent(err.message || "Failed to complete Canva authorization")}`);
  }
}
