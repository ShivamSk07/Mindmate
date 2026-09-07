import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/share/[id] -> Publicly viewable session data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        activePersona: true,
        user: { select: { username: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            searched: true,
            sources: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session || !session.isPublic) {
      return NextResponse.json(
        { error: "Shared conversation not found or is private." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      author: session.user?.name || session.user?.username || "Clarity User",
      persona: session.activePersona?.name || "Clarity",
      messages: session.messages,
    });
  } catch (error: any) {
    console.error("[Get Public Share Error]", error);
    return NextResponse.json({ error: "Failed to fetch shared chat" }, { status: 500 });
  }
}

// POST /api/share/[id] -> Toggle isPublic to true and return share link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = params.id;
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.userId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { isPublic: true },
    });

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    return NextResponse.json({
      success: true,
      shareUrl: `${appUrl}/share/${updated.id}`,
      sessionId: updated.id,
    });
  } catch (error: any) {
    console.error("[Create Share Link Error]", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
