import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    let profile = null;

    if (user) {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId },
      });
    }

    if (!profile || !profile.linkedinConnected) {
      profile = await prisma.userProfile.findFirst({
        where: { linkedinConnected: true },
      });
    }

    if (!profile || !profile.linkedinConnected) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      name: profile.linkedinName || "LinkedIn User",
      email: profile.linkedinEmail,
      avatarUrl: profile.linkedinAvatarUrl,
      personUrn: profile.linkedinPersonUrn,
    });
  } catch (error: any) {
    console.error("[LinkedIn Status Error]", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}

