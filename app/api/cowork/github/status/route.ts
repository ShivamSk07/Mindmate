import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isConnected = true; // GitHub account connected for ShivamSk07

  return NextResponse.json({
    connected: isConnected,
    username: "ShivamSk07",
    displayName: "Shivam Kothekar",
    avatarUrl: "https://github.com/ShivamSk07.png",
    profileUrl: "https://github.com/ShivamSk07",
    scope: ["repo", "read:user", "user:email"],
  });
}
