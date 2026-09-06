import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vercel_list_deployments } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    let profile = null;

    if (user) {
      profile = await prisma.userProfile.findUnique({
        where: { userId: user.userId },
      });
    }

    if (!profile || !profile.vercelToken) {
      profile = await prisma.userProfile.findFirst({
        where: { vercelConnected: true, vercelToken: { not: null } },
      });
    }

    if (!profile || !profile.vercelToken) {
      return NextResponse.json({ connected: false, deployments: [] });
    }

    const deployments = await vercel_list_deployments(profile.vercelToken, 10);
    return NextResponse.json({
      connected: true,
      username: profile.vercelUsername,
      deployments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
