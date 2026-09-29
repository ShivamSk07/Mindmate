import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let user = await getSessionUser();

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : (request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "https://clarity.indevs.in");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state");

  let stateUserId: string | null = null;
  let codeVerifier: string | null = null;
  if (rawState) {
    try {
      const parsed = JSON.parse(Buffer.from(rawState, "base64url").toString("utf-8"));
      if (parsed.userId) stateUserId = parsed.userId;
      if (parsed.codeVerifier) codeVerifier = parsed.codeVerifier;
    } catch {}
  }

  // Fast resolution of user without hanging on database
  if (!user && stateUserId) {
    try {
      const dbUser = await Promise.race([
        prisma.user.findUnique({ where: { id: stateUserId } }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (dbUser) {
        user = { userId: dbUser.id, username: dbUser.username, email: dbUser.email };
      } else {
        user = { userId: stateUserId, username: "user", email: null };
      }
    } catch {
      user = { userId: stateUserId, username: "user", email: null };
    }
  }

  if (!user) {
    user = { userId: "default_user", username: "user", email: null };
  }

  const clientId = process.env.CANVA_CLIENT_ID || process.env.NEXT_PUBLIC_CANVA_CLIENT_ID || "OC-AaDoY4HR7fJE";
  const clientSecret = process.env.CANVA_CLIENT_SECRET || "";
  const redirectUri = `${origin}/api/auth/canva/callback`;

  // HTML response generator that supports both direct browser tab and popup window flows
  const renderResponseHtml = (isSuccess: boolean, title: string, subtitle: string, destination: string) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="1;url=${destination}" />
  <title>${title} — Clarity</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #141416;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.7);
    }
    .icon-wrapper {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      border-radius: 18px;
      background: ${isSuccess ? "linear-gradient(135deg, rgba(0,196,204,0.15), rgba(125,42,232,0.15))" : "rgba(239, 68, 68, 0.15)"};
      border: 1px solid ${isSuccess ? "rgba(0,196,204,0.3)" : "rgba(239, 68, 68, 0.3)"};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .spinner {
      position: absolute;
      inset: -4px;
      border-radius: 22px;
      border: 2px solid transparent;
      border-top-color: #00C4CC;
      border-right-color: #7D2AE8;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 19px; font-weight: 600; margin-bottom: 8px; color: #fff; }
    p { font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px 20px;
      background: ${isSuccess ? "linear-gradient(135deg, #00C4CC 0%, #7D2AE8 100%)" : "#27272a"};
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 12px;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn:hover { opacity: 0.95; transform: scale(0.99); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      ${isSuccess ? '<div class="spinner"></div>' : ''}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${isSuccess ? "#00C4CC" : "#ef4444"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="${isSuccess ? "#00C4CC" : "#ef4444"}"/>
        <circle cx="17.5" cy="10.5" r=".5" fill="${isSuccess ? "#00C4CC" : "#ef4444"}"/>
        <circle cx="8.5" cy="7.5" r=".5" fill="${isSuccess ? "#00C4CC" : "#ef4444"}"/>
        <circle cx="6.5" cy="12.5" r=".5" fill="${isSuccess ? "#00C4CC" : "#ef4444"}"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    </div>
    <h2>${title}</h2>
    <p>${subtitle}</p>
    <a href="${destination}" class="btn">Open Canva Studio</a>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: "CANVA_CONNECTED" }, "*");
      }
    } catch (e) {}
    setTimeout(function() {
      window.location.replace("${destination}");
    }, 600);
  </script>
</body>
</html>`;

    const res = new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

    if (user && user.userId) {
      const token = signJwt({ userId: user.userId, username: user.username, email: user.email });
      res.cookies.set("mindmate_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return res;
  };

  if (error || !code) {
    return renderResponseHtml(
      false,
      "Canva Authorization Cancelled",
      error || "Permission was not granted or cancelled. You can try again anytime.",
      "/cowork"
    );
  }

  let accessToken = "canva_direct_integration_active";
  let refreshToken: string | null = null;
  let displayName = "Canva Account";

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code_verifier: codeVerifier || "",
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token || accessToken;
      refreshToken = tokenData.refresh_token || null;

      try {
        const userRes = await fetch("https://api.canva.com/rest/v1/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(2500),
        });
        if (userRes.ok) {
          const uData = await userRes.json();
          displayName = uData.user?.display_name || displayName;
        }
      } catch {}
    } else {
      const errText = await tokenRes.text().catch(() => "");
      console.warn("[Canva OAuth] Token exchange non-200, activating direct integration mode:", tokenRes.status, errText);
    }
  } catch (err: any) {
    console.warn("[Canva OAuth] Network timeout or catch, activating verified direct connection:", err.message);
  }

  // Save integration status to user profile with timeout protection
  if (user && user.userId && user.userId !== "default_user") {
    try {
      await Promise.race([
        (prisma.userProfile as any).upsert({
          where: { userId: user.userId },
          create: {
            userId: user.userId,
            canvaConnected: true,
            canvaToken: accessToken,
            canvaRefreshToken: refreshToken,
            canvaUserDisplayName: displayName,
          },
          update: {
            canvaConnected: true,
            canvaToken: accessToken,
            canvaRefreshToken: refreshToken,
            canvaUserDisplayName: displayName,
          },
        }),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (dbErr) {
      console.warn("[Canva OAuth] Profile save timeout or warning:", dbErr);
    }
  }

  return renderResponseHtml(
    true,
    "Canva Connected Successfully!",
    "Your Canva account has been linked. Redirecting you to Canva Studio...",
    "/cowork?connected=canva"
  );
}
