import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { vercel_deploy_files, vercel_deploy_repo, vercel_get_deployment_status } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Vercel is not connected. Please connect your Vercel account in Integrations." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { type, projectName, files, repo, branch } = body;

    const token = profile.vercelToken;
    const name = projectName || `clarity-app-${Date.now().toString(36)}`;

    if (type === "repo" && repo) {
      const result = await vercel_deploy_repo(token, name, repo, branch || "main");
      return NextResponse.json(result);
    }

    if (files && Array.isArray(files) && files.length > 0) {
      const result = await vercel_deploy_files(token, name, files);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid deployment payload. Provide 'files' array or 'repo' name." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Vercel Deploy API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to deploy to Vercel" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Vercel is not connected." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");

    if (!deploymentId) {
      return NextResponse.json({ error: "Deployment ID is required" }, { status: 400 });
    }

    const result = await vercel_get_deployment_status(profile.vercelToken, deploymentId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
