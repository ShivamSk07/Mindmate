import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { linkedin_get_profile } from "@/lib/linkedin";

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
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("[LinkedIn OAuth Callback Error]", error, errorDescription);
    return NextResponse.redirect(new URL(`/cowork?error=${encodeURIComponent(errorDescription || error)}`, appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/cowork?error=no_code_provided", appUrl));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;

  let accessToken: string | null = null;
  let personUrn: string | null = null;
  let linkedinName: string | null = null;
  let linkedinEmail: string | null = null;
  let linkedinAvatarUrl: string | null = null;

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId || "");
    params.append("client_secret", clientSecret || "");

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
      console.error("[LinkedIn OAuth Token Exchange Failed]", tokenRes.status, errBody);
    }
  } catch (e) {
    console.error("[LinkedIn OAuth Callback Exception]", e);
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/cowork?error=linkedin_auth_failed", appUrl));
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

  return NextResponse.redirect(new URL("/cowork?connected=linkedin", appUrl));
}
