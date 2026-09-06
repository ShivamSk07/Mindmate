import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
  }

  const clientId = process.env.VERCEL_CLIENT_ID || "oac_clarity_cowork";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/vercel/callback`);
  const stateData = {
    userId: user.userId,
    nonce: Math.random().toString(36).substring(7),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  const vercelAuthUrl = `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=deployments:write,projects:write,user:read`;

  const response = NextResponse.redirect(vercelAuthUrl);
  const token = signJwt({ userId: user.userId, username: user.username, email: user.email });
  response.cookies.set("mindmate_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
