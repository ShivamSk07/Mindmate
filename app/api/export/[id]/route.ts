import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;

    const session = await prisma.session.findFirst({
      where: { id: id, userId: user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!session) {
      return new Response("Conversation not found", { status: 404 });
    }

    let text = `Title: ${session.title}\n\n`;
    session.messages.forEach(m => {
      text += `${m.role.toUpperCase()}: ${m.content}\n\n`;
    });

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="chat_export_${id}.txt"`
      }
    });

  } catch (error) {
    console.error("[Export Single Error]", error);
    return new Response("Error generating export", { status: 500 });
  }
}
