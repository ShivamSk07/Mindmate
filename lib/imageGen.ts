import https from "https";

export interface GeneratedImageResult {
  success: boolean;
  imageUrl: string;
  prompt: string;
  model: string;
  source: "huggingface" | "serverless";
}

/**
 * Enhanced FLUX.1 Image Generation Engine
 * Supports Hugging Face Inference Router with zero-fail serverless fallbacks.
 */
export async function generateFluxImage(rawPrompt: string): Promise<GeneratedImageResult> {
  const prompt = rawPrompt.trim();
  const token = process.env.HUGGINGFACE_API_KEY || "";

  // 1. Attempt Hugging Face Serverless Router with User's Token
  if (token) {
    try {
      const hfResult = await new Promise<string | null>((resolve) => {
        const postData = JSON.stringify({ inputs: prompt });
        const req = https.request(
          {
            hostname: "router.huggingface.co",
            path: "/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(postData),
            },
            timeout: 25000,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              const buffer = Buffer.concat(chunks);
              if (res.statusCode === 200 && buffer.length > 500) {
                const base64 = buffer.toString("base64");
                const mime = res.headers["content-type"] || "image/jpeg";
                resolve(`data:${mime};base64,${base64}`);
              } else {
                resolve(null);
              }
            });
          }
        );

        req.on("error", () => resolve(null));
        req.on("timeout", () => {
          req.destroy();
          resolve(null);
        });

        req.write(postData);
        req.end();
      });

      if (hfResult) {
        return {
          success: true,
          imageUrl: hfResult,
          prompt,
          model: "FLUX.1-schnell (Hugging Face)",
          source: "huggingface",
        };
      }
    } catch (e) {
      console.warn("[HF Image Gen Fallback]:", e);
    }
  }

  // 2. High-speed Direct Serverless FLUX.1 Render Fallback
  const seed = Math.floor(Math.random() * 1000000);
  const serverlessUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`;

  return {
    success: true,
    imageUrl: serverlessUrl,
    prompt,
    model: "FLUX.1 HD",
    source: "serverless",
  };
}

/**
 * Detects if a message is asking for an image generation.
 */
export function isImageGenerationRequest(message: string): { isImage: boolean; prompt: string } {
  const trimmed = message.trim();

  // 1. Explicit slash commands: /image, /imagine, /draw, /generate
  const slashMatch = trimmed.match(/^\/(image|imagine|draw|generate|paint|art)\s+(.+)$/i);
  if (slashMatch) {
    return { isImage: true, prompt: slashMatch[2].trim() };
  }

  // 2. Natural language triggers: "generate an image of...", "draw a...", "create an image of..."
  const nlMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|draw|create|make|paint|render)\s+(?:an?\s+)?(?:image|picture|photo|illustration|art|painting|portrait)\s+(?:of|showing|with|depicting)\s+(.+)$/i
  );
  if (nlMatch) {
    return { isImage: true, prompt: nlMatch[1].trim() };
  }

  return { isImage: false, prompt: "" };
}
