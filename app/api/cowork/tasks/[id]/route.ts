import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUser } from "@/lib/auth";
import { getTask } from "@/lib/coworkAgent";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();

  const task = getTask(params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
