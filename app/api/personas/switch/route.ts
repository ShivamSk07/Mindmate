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
    const { conversation_id, persona_id } = body;

    if (!conversation_id || !persona_id) {
      return NextResponse.json({ error: "Conversation ID and Persona ID are required" }, { status: 400 });
    }

    const session = await prisma.session.findFirst({
      where: { id: conversation_id, userId: user.userId }
    });

    if (!session) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Verify if persona exists and is accessible
    const persona = await prisma.persona.findFirst({
      where: {
        id: persona_id,
        OR: [
          { isCustom: false },
          { userId: user.userId }
        ]
      }
    });

    if (!persona && !persona_id.startsWith("mindmate-default-")) {
      return NextResponse.json({ error: "Persona not found or inaccessible" }, { status: 404 });
    }

    await prisma.session.update({
      where: { id: conversation_id },
      data: {
        activePersonaId: persona_id.startsWith("mindmate-default-") ? null : persona_id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Switch Persona Error]", error);
    return NextResponse.json({ error: "Failed to switch persona" }, { status: 500 });
  }
}
