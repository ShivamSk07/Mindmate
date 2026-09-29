import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canva_fetch_projects } from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;

    let profile = null;
    if (user) {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId },
      });
    }

    if (!profile) {
      const dbUser = await prisma.user.findFirst();
      if (dbUser) {
        profile = await prisma.userProfile.findUnique({
          where: { userId: dbUser.id },
        });
      }
    }

    if (!profile) {
      profile = await prisma.userProfile.findFirst({
        where: { canvaConnected: true },
      });
    }

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
