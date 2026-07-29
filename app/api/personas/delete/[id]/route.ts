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

    const persona = await prisma.persona.findFirst({
      where: { id: id, userId: user.userId, isCustom: true }
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found or unauthorized" }, { status: 403 });
    }

    await prisma.persona.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Delete Persona Error]", error);
    return NextResponse.json({ error: "Failed to delete persona" }, { status: 500 });
  }
}
