import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { linkedin_create_post } from "@/lib/linkedin";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.linkedinConnected || !profile.linkedinToken) {
      return NextResponse.json(
        { error: "LinkedIn account is not connected. Please connect LinkedIn in Integrations." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Post text is required" }, { status: 400 });
    }

    const authorUrn = profile.linkedinPersonUrn || "me";
    const result = await linkedin_create_post(profile.linkedinToken, authorUrn, text);

    if (result.success) {
      return NextResponse.json({
        success: true,
        postId: result.postId,
        postUrl: result.postUrl,
      });
    } else {
      return NextResponse.json({ error: result.error || "Failed to publish post" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[LinkedIn Post API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to publish post" }, { status: 500 });
  }
}
