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

  const clientId = process.env.GITHUB_CLIENT_ID || "ov23liClarityApp";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/github/callback`);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo%20read:user%20user:email&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(githubAuthUrl);
}
