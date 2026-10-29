import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.vercelConnected) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      username: profile.vercelUsername || "Vercel User",
      avatarUrl: profile.vercelAvatarUrl,
      teamId: profile.vercelTeamId,
    });
  } catch (error: any) {
    console.error("[Vercel Status Error]", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
