import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canva_create_design } from "@/lib/canva";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser().catch(() => null);

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Design prompt is required" }, { status: 400 });
    }

    let token = null;
    if (user?.userId) {
      try {
        const profile = await prisma.userProfile.findUnique({
          where: { userId: user.userId },
        });
        token = (profile as any)?.canvaToken;
      } catch (e) {}
    }

    const result = await canva_create_design(prompt.trim(), token);

    return NextResponse.json({
      success: true,
      design: result.designSpec,
      editUrl: result.editUrl,
    });
  } catch (error: any) {
    console.error("[Canva Create API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to generate Canva design" }, { status: 500 });
  }
}
