import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
const cerebras = cerebrasApiKey ? new Cerebras({ apiKey: cerebrasApiKey }) : null;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "File and sessionId are required" }, { status: 400 });
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: user.userId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const fileType = file.type;
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    let textContent = "";

    if (extension === "txt" || extension === "md" || extension === "json" || extension === "csv") {
      textContent = buffer.toString("utf-8");
    } else if (extension === "pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        textContent = parsed.text || "";
      } catch (err) {
        console.error("PDF Parsing error:", err);
        return NextResponse.json({ error: "Failed to parse PDF document" }, { status: 500 });
      }
    } else if (extension === "docx") {
      try {
        const mammoth = require("mammoth");
        const parsed = await mammoth.extractRawText({ buffer });
        textContent = parsed.value || "";
      } catch (err) {
        console.error("DOCX Parsing error:", err);
        return NextResponse.json({ error: "Failed to parse Word document" }, { status: 500 });
      }
    } else if (fileType.startsWith("image/")) {
      try {
        if (!cerebras) {
          return NextResponse.json({ error: "CEREBRAS_API_KEY is not configured on server" }, { status: 500 });
        }
        const base64Image = buffer.toString("base64");
        const response = await cerebras.chat.completions.create({
          model: "gemma-4-31b",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "OCR this image. Extract all text verbatim and describe the visual contents and layout in detail." },
                { type: "image_url", image_url: { url: `data:${fileType};base64,${base64Image}` } }
              ]
            }
          ] as any,
          temperature: 0.1,
        }) as any;
        textContent = response.choices[0]?.message?.content || "No text could be extracted from this image.";
      } catch (err) {
        console.error("Image OCR error:", err);
        return NextResponse.json({ error: "Failed to perform OCR on image" }, { status: 500 });
      }
    } else {
      // Fallback: try reading as text
      textContent = buffer.toString("utf-8");
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: "Document is empty or could not be parsed" }, { status: 400 });
    }

    // Save document to DB
    const doc = await prisma.document.create({
      data: {
        filename,
        fileType: extension,
        content: textContent,
        sessionId,
      },
    });

    // Chunk document (approx 1000 characters per chunk)
    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < textContent.length; i += chunkSize) {
      chunks.push(textContent.substring(i, i + chunkSize));
    }

    // Bulk save chunks
    await prisma.documentChunk.createMany({
      data: chunks.map(content => ({
        content,
        documentId: doc.id,
      })),
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      filename,
      length: textContent.length,
      chunksCount: chunks.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
