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
    const { selectedText, targetTitle } = body;

    if (!selectedText || !selectedText.trim()) {
      return NextResponse.json({ error: "No text selected for extraction." }, { status: 400 });
    }

    const snippet = selectedText.trim();
    const fallbackTitle = targetTitle || snippet.slice(0, 24) || "Extracted Conversation";

    const newSession = await prisma.session.create({
      data: {
        title: `Extracted: ${fallbackTitle}`,
        userId: user.userId,
        messages: {
          create: [
            {
              role: "user",
              content: snippet,
            }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, newSessionId: newSession.id });
  } catch (error) {
    console.error("[Extract Chat Error]", error);
    return NextResponse.json({ error: "Failed to extract conversation" }, { status: 500 });
  }
}
