import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[Get Tasks Error]", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        status: status || "todo",
        userId: user.userId,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("[Create Task Error]", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
