import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "installer";

  const fileName =
    type === "portable" ? "Clarity 1.0.0.exe" : "Clarity Setup 1.0.0.exe";
  const filePath = path.join(process.cwd(), "dist", fileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Requested download file not found." },
      { status: 404 }
    );
  }

  const stat = fs.statSync(filePath);
  const fileStream = fs.createReadStream(filePath);

  // Convert Node ReadStream to Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/vnd.microsoft.portable-executable",
      "Content-Length": stat.size.toString(),
    },
  });
}
