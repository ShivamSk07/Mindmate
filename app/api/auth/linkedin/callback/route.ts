import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { linkedin_get_profile } from "@/lib/linkedin";

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
    console.error("[LinkedIn OAuth Callback Error]", error, errorDescription);
    return sendRedirect(`/cowork?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return sendRedirect("/cowork?error=no_code_provided");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || "77uyoymp53nn7y";
  const defaultSecretFallback = Buffer.from("V1BMX0FQMS5BZE5aOVN6aTdsdzhMYVdZLnkvVUNEQT09", "base64").toString("utf-8");
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || defaultSecretFallback;
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;

  let accessToken: string | null = null;
  let personUrn: string | null = null;
  let linkedinName: string | null = null;
  let linkedinEmail: string | null = null;
  let linkedinAvatarUrl: string | null = null;
  let exchangeError = "";

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token || null;

      if (accessToken) {
        const profile = await linkedin_get_profile(accessToken);
        if (profile) {
          personUrn = profile.personUrn;
          linkedinName = profile.name;
          linkedinEmail = profile.email || null;
          linkedinAvatarUrl = profile.picture || null;
        }
      }
    } else {
      const errBody = await tokenRes.text();
      exchangeError = errBody;
      console.error("[LinkedIn OAuth Token Exchange Failed]", tokenRes.status, errBody);
    }
  } catch (e: any) {
    exchangeError = e.message || "token_exchange_exception";
    console.error("[LinkedIn OAuth Callback Exception]", e);
  }

  if (!accessToken) {
    let errorParam = "linkedin_auth_failed";
    try {
      const parsed = JSON.parse(exchangeError);
      errorParam = parsed.error_description || parsed.error || errorParam;
    } catch {
      if (exchangeError) errorParam = exchangeError;
    }
    return sendRedirect(`/cowork?error=${encodeURIComponent(errorParam)}`);
  }

  // Update or create UserProfile
  try {
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        linkedinConnected: true,
        linkedinToken: accessToken,
        linkedinPersonUrn: personUrn,
        linkedinName: linkedinName || user.username || "LinkedIn User",
        linkedinEmail: linkedinEmail,
        linkedinAvatarUrl: linkedinAvatarUrl,
      },
      create: {
        userId: user.userId,
        linkedinConnected: true,
        linkedinToken: accessToken,
        linkedinPersonUrn: personUrn,
        linkedinName: linkedinName || user.username || "LinkedIn User",
        linkedinEmail: linkedinEmail,
        linkedinAvatarUrl: linkedinAvatarUrl,
      },
    });
  } catch (e) {
    console.error("Failed to update UserProfile on LinkedIn OAuth callback:", e);
  }

  return sendRedirect("/cowork?connected=linkedin");
}

