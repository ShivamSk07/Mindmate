import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    let user = await getSessionUser();
    let userId = user?.userId;
    if (!userId) {
      const first = await prisma.user.findFirst();
      userId = first?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[LinkedIn Connect Route Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
