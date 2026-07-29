import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { memory_vault } = body;

    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: { memoryVault: memory_vault || "" },
      create: {
        userId: user.userId,
        memoryVault: memory_vault || "",
        themePreference: "dark",
        fontSize: "15",
        language: "English",
        bubbleStyle: "modern"
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Memory Update Error]", error);
    return NextResponse.json({ error: "Failed to update memory vault" }, { status: 500 });
  }
}
