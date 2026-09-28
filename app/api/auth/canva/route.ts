import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

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

  const clientId = process.env.CANVA_CLIENT_ID || process.env.NEXT_PUBLIC_CANVA_CLIENT_ID || "OC-AaDoY4HR7fJE";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/canva/callback`);

  // Generate PKCE code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const stateData = {
    userId: user.userId,
    codeVerifier,
    nonce: Math.random().toString(36).substring(7),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");
  const scopes = encodeURIComponent("design:content:read design:content:write design:meta:read asset:read asset:write brandtemplate:content:read brandtemplate:meta:read");

  if (clientId) {
    const canvaAuthUrl = `https://www.canva.com/api/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scopes}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    const response = NextResponse.redirect(canvaAuthUrl);
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

  return NextResponse.redirect(new URL("/cowork?canva_setup=needed", appUrl));
}
