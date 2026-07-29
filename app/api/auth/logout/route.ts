import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  clearSessionCookie();
  return NextResponse.json({ success: true });
}
