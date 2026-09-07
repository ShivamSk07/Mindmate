import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/share/[id]/fork -> Fork public conversation into current user's workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to fork this chat." }, { status: 401 });
    }

    const sessionId = params.id;
    const sourceSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sourceSession || !sourceSession.isPublic) {
      return NextResponse.json({ error: "Conversation is private or does not exist." }, { status: 404 });
    }

    // Create a cloned session for the current user
    const forkedSession = await prisma.session.create({
      data: {
        title: `Fork of ${sourceSession.title}`,
        userId: user.userId,
        activePersonaId: sourceSession.activePersonaId,
        isPublic: false,
      },
    });

    // Clone all messages
    if (sourceSession.messages.length > 0) {
      await prisma.message.createMany({
        data: sourceSession.messages.map((m) => ({
          role: m.role,
          content: m.content,
          searched: m.searched,
          sources: m.sources as any,
          sessionId: forkedSession.id,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      forkedSessionId: forkedSession.id,
      message: "Chat successfully forked to your workspace!",
    });
  } catch (error: any) {
    console.error("[Fork Chat Error]", error);
    return NextResponse.json({ error: "Failed to fork chat" }, { status: 500 });
  }
}
