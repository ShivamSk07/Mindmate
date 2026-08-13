import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { continueTaskWithFollowup } from "@/lib/coworkAgent";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Follow-up prompt is required" }, { status: 400 });
    }

    const task = await continueTaskWithFollowup(params.id, prompt.trim());
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to continue task" }, { status: 500 });
  }
}
