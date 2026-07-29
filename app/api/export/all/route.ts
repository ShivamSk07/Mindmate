import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    let text = "--- MINDMATE CHAT EXPORT ---\n\n";
    sessions.forEach(session => {
      text += `=== Conversation: ${session.title} ===\n`;
      session.messages.forEach(m => {
        text += `${m.role.toUpperCase()}: ${m.content}\n\n`;
      });
      text += "\n";
    });

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="all_chats_export.txt"'
      }
    });

  } catch (error) {
    console.error("[Export All Error]", error);
    return new Response("Error generating export", { status: 500 });
  }
}
