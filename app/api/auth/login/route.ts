import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateCheck = checkRateLimit(request, 5, 60 * 1000); // 5 attempts per minute per IP
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many login attempts. Please wait a minute before trying again." }, { status: 429 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Set session cookie
    setSessionCookie(user);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json({ error: "Something went wrong during login" }, { status: 500 });
  }
}
