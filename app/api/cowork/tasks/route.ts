import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAndRunTask, getAllTasks } from "@/lib/coworkAgent";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = getAllTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, repoName, branch } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Task prompt is required" }, { status: 400 });
    }

    const task = await createAndRunTask(prompt.trim(), repoName, branch || "main");
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create task" }, { status: 500 });
  }
}
