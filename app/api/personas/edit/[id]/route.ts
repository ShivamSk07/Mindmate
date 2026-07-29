import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, system_prompt, tone } = body;

    const persona = await prisma.persona.findFirst({
      where: { id: id, userId: user.userId, isCustom: true }
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found or unauthorized" }, { status: 403 });
    }

    await prisma.persona.update({
      where: { id: id },
      data: {
        name: name ?? persona.name,
        systemPrompt: system_prompt ?? persona.systemPrompt,
        tone: tone ?? persona.tone
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Edit Persona Error]", error);
    return NextResponse.json({ error: "Failed to edit persona" }, { status: 500 });
  }
}
