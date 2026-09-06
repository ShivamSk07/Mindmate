import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  let userId = "guest_user";
  try {
    const user = await getSessionUser();
    if (user?.userId) userId = user.userId;
  } catch (e) {
    console.warn("Session lookup notice:", e);
  }

  const clientId = process.env.VERCEL_CLIENT_ID?.trim() || "oac_fbIMmseds7b8hfjKwtnYCJv0";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/vercel/callback`);
  const stateData = {
    userId,
    nonce: Math.random().toString(36).substring(7),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  const vercelAuthUrl = `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

  return NextResponse.redirect(vercelAuthUrl);
}
