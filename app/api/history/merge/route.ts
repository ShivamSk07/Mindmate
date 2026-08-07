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
    const { sourceSessionIds, targetTitle } = body;

    if (!Array.isArray(sourceSessionIds) || sourceSessionIds.length < 2) {
      return NextResponse.json({ error: "Select at least 2 conversations to merge." }, { status: 400 });
    }

    // Fetch sessions
    const sessions = await prisma.session.findMany({
      where: {
        id: { in: sourceSessionIds },
        userId: user.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (sessions.length < 2) {
      return NextResponse.json({ error: "Could not find all selected conversations." }, { status: 404 });
    }

    // Combine all messages chronologically
    const allMessages: Array<{ role: string; content: string; createdAt: Date }> = [];
    sessions.forEach((s) => {
      s.messages.forEach((m) => {
        allMessages.push({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        });
      });
    });

    allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const title = targetTitle?.trim() || `Merged: ${sessions[0].title.slice(0, 20)}`;

    // Create new merged session
    const mergedSession = await prisma.session.create({
      data: {
        title,
        userId: user.userId,
        folder: sessions[0].folder || "",
        messages: {
          create: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        }
      }
    });

    // Delete old source sessions
    await prisma.session.deleteMany({
      where: {
        id: { in: sourceSessionIds },
        userId: user.userId
      }
    });

    return NextResponse.json({ success: true, newSessionId: mergedSession.id });
  } catch (error) {
    console.error("[Merge Sessions Error]", error);
    return NextResponse.json({ error: "Failed to merge conversations" }, { status: 500 });
  }
}
