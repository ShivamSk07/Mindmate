import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let profile: any = null;
    try {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId }
      });
    } catch (e) {
      console.warn("[Profile GET query fallback]", e);
    }

    return NextResponse.json({
      username: user.username,
      email: user.email,
      profile: profile || {
        themePreference: "dark",
        fontSize: "15",
        language: "English",
        bubbleStyle: "modern"
      }
    });

  } catch (error) {
    console.error("[Profile GET Error]", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, themePreference, fontSize, language, bubbleStyle } = body;

    // Update user username
    if (username && username.trim() !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.userId },
        data: { username }
      });
    }

    // Update user profile
    await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: {
        themePreference: themePreference ?? "dark",
        fontSize: fontSize?.toString() ?? "15",
        language: language ?? "English",
        bubbleStyle: bubbleStyle ?? "modern"
      },
      create: {
        userId: user.userId,
        memoryVault: "[]",
        themePreference: themePreference ?? "dark",
        fontSize: fontSize?.toString() ?? "15",
        language: language ?? "English",
        bubbleStyle: bubbleStyle ?? "modern"
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Profile POST Error]", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
