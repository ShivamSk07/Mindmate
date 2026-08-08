import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body; // "connect" | "disconnect"

  if (action === "disconnect") {
    return NextResponse.json({
      connected: false,
      message: "GitHub account disconnected.",
    });
  }

  return NextResponse.json({
    connected: true,
    username: "ShivamSk07",
    displayName: "Shivam Kothekar",
    avatarUrl: "https://github.com/ShivamSk07.png",
    profileUrl: "https://github.com/ShivamSk07",
    message: "GitHub account connected successfully.",
  });
}
