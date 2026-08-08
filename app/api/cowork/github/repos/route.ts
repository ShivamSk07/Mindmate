import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { github_list_repositories } from "@/lib/github";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await github_list_repositories("ShivamSk07");
    return NextResponse.json({ repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch repositories" }, { status: 500 });
  }
}
