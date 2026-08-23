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

    // 1. Generate Mermaid.ink URLs (high reliability, fast, zero 500 error)
    const obj = {
      code: cleanMermaid,
      mermaid: { theme: "dark" },
    };
    const inkBase64 = Buffer.from(JSON.stringify(obj)).toString("base64");
    const inkSvgUrl = `https://mermaid.ink/svg/${inkBase64}`;
    const inkPngUrl = `https://mermaid.ink/img/${inkBase64}`;

    // 2. Generate Kroki URLs as alternative
    const buffer = Buffer.from(cleanMermaid, "utf-8");
    const compressed = zlib.deflateSync(buffer, { level: 9 });
    const krokiBase64 = compressed
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const krokiSvgUrl = `https://kroki.io/mermaid/svg/${krokiBase64}`;
    const krokiPngUrl = `https://kroki.io/mermaid/png/${krokiBase64}`;

    return NextResponse.json({
      url: inkSvgUrl, // Primary SVG URL (reliable mermaid.ink)
      pngUrl: inkPngUrl, // Primary PNG URL
      krokiUrl: krokiSvgUrl,
      krokiPngUrl: krokiPngUrl,
      cleanMermaid,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to generate diagram URLs" }, { status: 500 });
  }
}

