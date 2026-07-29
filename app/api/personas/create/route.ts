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
    const { name, system_prompt, tone } = body;

    if (!name || !system_prompt) {
      return NextResponse.json({ error: "Name and System Prompt are required" }, { status: 400 });
    }

    const persona = await prisma.persona.create({
      data: {
        name,
        systemPrompt: system_prompt,
        tone: tone || "Custom",
        isCustom: true,
        userId: user.userId
      }
    });

    return NextResponse.json({ success: true, id: persona.id });

  } catch (error) {
    console.error("[Create Persona Error]", error);
    return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
  }
}
