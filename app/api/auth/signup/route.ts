import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateCheck = checkRateLimit(request, 5, 60 * 1000); // 5 signups per minute per IP
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many signup requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username or Email already exists" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profile: {
          create: {
            memoryVault: "[]",
            themePreference: "dark",
            fontSize: "15",
            language: "English",
            bubbleStyle: "modern"
          }
        }
      }
    });

    // Automatically login user
    setSessionCookie(user);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

  } catch (error) {
    console.error("[Signup Error]", error);
    return NextResponse.json({ error: "Something went wrong during signup" }, { status: 500 });
  }
}
