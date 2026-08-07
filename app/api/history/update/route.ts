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
    const { sessionId, folder, title, isPinned, isLocked, pinCode } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.userId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        folder: folder !== undefined ? folder : session.folder,
        title: title !== undefined ? title : session.title,
        isPinned: isPinned !== undefined ? isPinned : session.isPinned,
        isLocked: isLocked !== undefined ? isLocked : session.isLocked,
        pinCode: pinCode !== undefined ? pinCode : session.pinCode,
      },
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error("[Update Session Error]", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
