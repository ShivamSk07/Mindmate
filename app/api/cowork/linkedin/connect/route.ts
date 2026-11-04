import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.userId;

    const body = await request.json().catch(() => ({}));
    const { action, token, displayName, personUrn } = body;

    if (action === "disconnect") {
      await prisma.userProfile.updateMany({
        where: { userId },
        data: {
          linkedinConnected: false,
          linkedinToken: null,
          linkedinRefreshToken: null,
          linkedinPersonUrn: null,
          linkedinName: null,
          linkedinEmail: null,
          linkedinAvatarUrl: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "LinkedIn account disconnected successfully.",
      });
    }

    // Manual Access Token save fallback
    if (token && typeof token === "string" && token.trim()) {
      const cleanToken = token.trim();
      let profileName = displayName?.trim() || "LinkedIn User";
      let resolvedUrn = personUrn?.trim() || null;
      let profileEmail: string | null = null;
      let avatarUrl: string | null = null;

      try {
        const { linkedin_get_profile } = await import("@/lib/linkedin");
        const prof = await linkedin_get_profile(cleanToken);
        if (prof) {
          profileName = prof.name || profileName;
          resolvedUrn = prof.personUrn || resolvedUrn;
          profileEmail = prof.email || null;
          avatarUrl = prof.picture || null;
        }
      } catch (e) {
        console.warn("[LinkedIn Manual Token verification notice]", e);
      }

      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          linkedinConnected: true,
          linkedinToken: cleanToken,
          linkedinPersonUrn: resolvedUrn,
          linkedinName: profileName,
          linkedinEmail: profileEmail,
          linkedinAvatarUrl: avatarUrl,
        },
        create: {
          userId,
          linkedinConnected: true,
          linkedinToken: cleanToken,
          linkedinPersonUrn: resolvedUrn,
          linkedinName: profileName,
          linkedinEmail: profileEmail,
          linkedinAvatarUrl: avatarUrl,
        },
      });

      return NextResponse.json({
        success: true,
        connected: true,
        message: `LinkedIn connected successfully as @${profileName}`,
        name: profileName,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[LinkedIn Connect Route Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
