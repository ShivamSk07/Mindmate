import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

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
    setSessionCookie({ id: dbUser.id, username: dbUser.username, email: dbUser.email });
    user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || "77uyoymp53nn7y";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/linkedin/callback`);
  const state = Math.random().toString(36).substring(7);
  const scopes = encodeURIComponent("openid profile email w_member_social");

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}`;

  return NextResponse.redirect(linkedinAuthUrl);
}
