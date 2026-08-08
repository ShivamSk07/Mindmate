import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllTasks } from "@/lib/coworkAgent";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = getAllTasks();
  return NextResponse.json({ tasks });
}
