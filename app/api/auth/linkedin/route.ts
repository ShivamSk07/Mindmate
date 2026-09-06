import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    // If client ID is missing, redirect with helpful error status
    console.error("[LinkedIn OAuth] LINKEDIN_CLIENT_ID is not configured in .env");
    return NextResponse.redirect(new URL("/cowork?error=linkedin_missing_client_id", appUrl));
  }

  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/linkedin/callback`);
  const state = Math.random().toString(36).substring(7);
  const scopes = encodeURIComponent("openid profile email w_member_social");

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}`;

  return NextResponse.redirect(linkedinAuthUrl);
}
