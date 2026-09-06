import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vercel_get_user } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const rawState = searchParams.get("state");

  let stateUserId: string | null = null;
  if (rawState) {
    try {
      const parsed = JSON.parse(Buffer.from(rawState, "base64url").toString("utf-8"));
      if (parsed.userId) stateUserId = parsed.userId;
    } catch {}
  }

  // Restore user from state if session cookie was lost across cross-origin redirect
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

  if (error) {
    console.error("[Vercel OAuth Callback Error]", error, errorDescription);
    return sendRedirect(`/cowork?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return sendRedirect("/cowork?error=no_code_provided");
  }

  const clientId = process.env.VERCEL_CLIENT_ID || "oac_fbIMmseds7b8hfjKwtnYCJv0";
  const clientSecret = process.env.VERCEL_CLIENT_SECRET || "eJKh6K1VsMsCVU5Gd4HjhK0e";
  const redirectUri = `${appUrl}/api/auth/vercel/callback`;

  let accessToken: string | null = null;
  let vercelUsername = "Vercel User";
  let vercelAvatarUrl: string | null = null;
  let vercelTeamId: string | null = null;
  let exchangeError = "";

  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code", code);
    params.append("redirect_uri", redirectUri);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const tokenRes = await fetch("https://api.vercel.com/v2/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token || null;
      vercelTeamId = tokenData.team_id || null;

      if (accessToken) {
        try {
          const vercelUser = await vercel_get_user(accessToken);
          if (vercelUser) {
            vercelUsername = vercelUser.username;
            vercelAvatarUrl = vercelUser.avatar || null;
          }
        } catch (uErr) {
          console.warn("User profile fetch notice:", uErr);
        }
      }
    } else {
      exchangeError = await tokenRes.text();
      console.error("[Vercel OAuth Token Exchange Error]", tokenRes.status, exchangeError);
    }
  } catch (e: any) {
    exchangeError = e.message || "token_exchange_exception";
    console.error("[Vercel OAuth Callback Exception]", e);
  }

  if (!accessToken) {
    return sendRedirect(`/cowork?error=${encodeURIComponent(exchangeError || "vercel_auth_failed")}`);
  }

  // Update or create UserProfile
  try {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        vercelConnected: true,
        vercelToken: accessToken,
        vercelUsername,
        vercelAvatarUrl,
        vercelTeamId,
      },
      create: {
        userId: user.userId,
        vercelConnected: true,
        vercelToken: accessToken,
        vercelUsername,
        vercelAvatarUrl,
        vercelTeamId,
      },
    });
  } catch (e) {
    console.error("Failed to update UserProfile on Vercel OAuth callback:", e);
  }

  return sendRedirect("/cowork?connected=vercel");
}
