import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";
import { sanitizeMermaid } from "@/lib/coworkAgent";

export async function POST(request: NextRequest) {
  try {
    const { mermaid } = await request.json();
    if (!mermaid) {
      return NextResponse.json({ error: "Mermaid code is required" }, { status: 400 });
    }
    const cleanMermaid = sanitizeMermaid(mermaid);
    const buffer = Buffer.from(cleanMermaid, "utf-8");
    const compressed = zlib.deflateSync(buffer);
    const base64 = compressed.toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    
    return NextResponse.json({
      url: `https://kroki.io/mermaid/svg/${base64}`,
      pngUrl: `https://kroki.io/mermaid/png/${base64}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to generate Kroki URL" }, { status: 500 });
  }
}
