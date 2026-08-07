import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Get messages for specific session
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: user.userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!session) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      // Check PIN lock authentication
      const reqPin = searchParams.get("pinCode");
      if (session.isLocked && session.pinCode) {
        if (reqPin !== session.pinCode) {
          return NextResponse.json({
            isLocked: true,
            error: "Chat is locked. Please enter valid 4-digit PIN."
          }, { status: 403 });
        }
      }

      // Map to correct properties
      const messages = session.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        searched: m.searched,
        sources: m.sources || [],
        reaction: m.reaction,
        feedback: m.feedback,
        isFlagged: m.isFlagged,
        confidence: m.confidence,
        createdAt: m.createdAt
      }));

      return NextResponse.json({
        messages,
        isLocked: session.isLocked,
        isPinned: session.isPinned
      });
    }

    // Get all sessions for the logged-in user
    const sessions = await prisma.session.findMany({
      where: { userId: user.userId },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" }
      ],
      include: {
        messages: {
          select: { id: true }
        }
      }
    });

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId }
    });

    const data = sessions.map(s => ({
      id: s.id,
      title: s.title,
      is_pinned: s.isPinned,
      is_locked: s.isLocked,
      has_pin: Boolean(s.pinCode),
      folder: s.folder,
      active_persona_id: s.activePersonaId,
      _count: { messages: s.messages.length }
    }));

    return NextResponse.json({
      conversations: data,
      sessions: data,
      username: user.username,
      profile: profile
    });
    } catch (error) {
    console.error("[History API Error]", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      // Delete all sessions of the user
      await prisma.session.deleteMany({
        where: { userId: user.userId }
      });
      return NextResponse.json({ success: true });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Delete specific session
    await prisma.session.delete({
      where: { id: sessionId, userId: user.userId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Delete Session Error]", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
