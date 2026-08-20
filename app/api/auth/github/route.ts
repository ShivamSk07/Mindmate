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

  const clientId = process.env.GITHUB_CLIENT_ID || "ov23liClarityApp";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/github/callback`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo%20read:user%20user:email&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(githubAuthUrl);
}
