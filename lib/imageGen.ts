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
export async function generateFluxImage(rawPrompt: string, requestedModel?: string): Promise<GeneratedImageResult> {
  const prompt = rawPrompt.trim();
  const token = process.env.HUGGINGFACE_API_KEY || "";

  // 1. Attempt Hugging Face Serverless Router (FLUX.1-dev or FLUX.1-schnell) if token is available
  if (token) {
    const hfModels = [
      "black-forest-labs/FLUX.1-dev",
      "stabilityai/stable-diffusion-3.5-large",
      "black-forest-labs/FLUX.1-schnell"
    ];

    for (const hfModel of hfModels) {
      try {
        const hfResult = await new Promise<string | null>((resolve) => {
          const postData = JSON.stringify({ inputs: prompt });
          const req = https.request(
            {
              hostname: "router.huggingface.co",
              path: `/hf-inference/models/${hfModel}`,
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
            model: hfModel,
            source: "huggingface",
          };
        }
      } catch (e) {
        console.warn(`[HF Image Gen ${hfModel} Fallback]:`, e);
      }
    }
  }

  // 2. High-Quality Free Serverless Fallbacks with Pollinations (FLUX.1 Dev / Realism & SD 3.5)
  const seed = Math.floor(Math.random() * 1000000);
  const lower = prompt.toLowerCase();

  // Smart model selector based on user intent
  let selectedModel = requestedModel || "flux-realism";
  if (!requestedModel) {
    if (lower.includes("sd3") || lower.includes("stable diffusion 3") || lower.includes("sd 3.5")) {
      selectedModel = "stablediffusion-3.5";
    } else if (lower.includes("dev") || lower.includes("pro") || lower.includes("detail")) {
      selectedModel = "flux-pro";
    } else if (lower.includes("anime") || lower.includes("manga") || lower.includes("chibi")) {
      selectedModel = "flux-anime";
    } else if (lower.includes("3d") || lower.includes("render") || lower.includes("pixar") || lower.includes("cgi")) {
      selectedModel = "flux-3d";
    } else if (lower.includes("fast") || lower.includes("quick") || lower.includes("turbo")) {
      selectedModel = "turbo";
    } else if (lower.includes("cinematic") || lower.includes("midjourney") || lower.includes("artistic")) {
      selectedModel = "midjourney";
    }
  }

  // Generate Pollinations URL with enhance=true for LLM prompt optimization and nologo=true
  const serverlessUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?model=${encodeURIComponent(selectedModel)}&width=1024&height=1024&enhance=true&nologo=true&seed=${seed}`;

  const modelDisplayName =
    selectedModel === "flux-realism"
      ? "FLUX.1 Realism HD (Free)"
      : selectedModel === "midjourney"
      ? "Midjourney Style v6 (Free)"
      : selectedModel === "flux-anime"
      ? "FLUX Anime (Free)"
      : selectedModel === "flux-3d"
      ? "FLUX 3D Render (Free)"
      : selectedModel === "turbo"
      ? "SDXL Turbo (Free)"
      : "FLUX.1 HD (Free)";

  return {
    success: true,
    imageUrl: serverlessUrl,
    prompt,
    model: modelDisplayName,
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
