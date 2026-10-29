import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canva_fetch_projects } from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        connected: false,
        displayName: "Canva Workspace",
        projects: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    const isConnected = Boolean((profile as any)?.canvaConnected);
    const token = (profile as any)?.canvaToken;
    const displayName = (profile as any)?.canvaUserDisplayName || "Canva Workspace";

    const result = await canva_fetch_projects(token || "", query);

    return NextResponse.json({
      success: true,
      connected: isConnected,
      displayName,
      projects: result.projects,
    });
  } catch (error: any) {
    console.error("[Canva Projects API Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Canva projects" },
      { status: 500 }
    );
  }
}
