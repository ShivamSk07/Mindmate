import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAutoCleanupIfNeeded } from "@/lib/cleanup";
import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_KEY || process.env.CEREBRAS_API_KEY;
const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger auto cleanup of expired documents in background
    runAutoCleanupIfNeeded().catch(() => {});

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const fileType = file.type || "";
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    let textContent = "";

    if (extension === "txt" || extension === "md" || extension === "json" || extension === "csv" || extension === "ts" || extension === "js" || extension === "py" || extension === "html" || extension === "css") {
      textContent = buffer.toString("utf-8");
    } else if (extension === "pdf") {
      try {
        const pdfModule = require("pdf-parse");
        if (typeof pdfModule === "function") {
          const parsed = await pdfModule(buffer);
          textContent = parsed.text || "";
        } else if (pdfModule && pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const parsed = await parser.getText();
          textContent = parsed?.text || "";
        } else {
          textContent = buffer.toString("utf-8");
        }
      } catch (err: any) {
        console.error("PDF Parsing error:", err);
        return NextResponse.json({ error: `Failed to parse PDF document: ${err?.message || ""}` }, { status: 500 });
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
    } else if (fileType.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(extension)) {
      try {
        if (!groqClient) {
          return NextResponse.json({ error: "GROQ_API_KEY is not configured on server" }, { status: 500 });
        }
        const base64Image = buffer.toString("base64");
        const mimeType = fileType || (extension === "png" ? "image/png" : "image/jpeg");
        const response = await groqClient.chat.completions.create({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "OCR and analyze this image in high detail. Extract all text verbatim and describe any charts, diagrams, tables, or visuals accurately." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
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

    let docId = "";

    // If valid sessionId is provided, save to DB
    if (sessionId) {
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: user.userId },
      });
      if (session) {
        const doc = await prisma.document.create({
          data: {
            filename,
            fileType: extension,
            content: textContent,
            sessionId,
          },
        });
        docId = doc.id;

        // Chunk document (approx 1000 characters per chunk)
        const chunkSize = 1000;
        const chunks: string[] = [];
        for (let i = 0; i < textContent.length; i += chunkSize) {
          chunks.push(textContent.substring(i, i + chunkSize));
        }

        await prisma.documentChunk.createMany({
          data: chunks.map(content => ({
            content,
            documentId: doc.id,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      documentId: docId || null,
      filename,
      textContent: textContent.trim(),
      length: textContent.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
