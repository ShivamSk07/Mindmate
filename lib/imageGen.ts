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

  const togetherKey = process.env.TOGETHER_API_KEY || "";
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY || "";
  const replicateKey = process.env.REPLICATE_API_KEY || "";
  const hfToken = process.env.HUGGINGFACE_API_KEY || "";

  // 1. Attempt Together AI (Ultra Studio Quality FLUX.1)
  if (togetherKey) {
    try {
      const res = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${togetherKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell",
          prompt: prompt,
          width: 1024,
          height: 1024,
          steps: 4,
          n: 1,
          response_format: "b64_json",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          return {
            success: true,
            imageUrl: `data:image/jpeg;base64,${b64}`,
            prompt,
            model: "FLUX.1 Schnell (Together AI)",
            source: "huggingface",
          };
        }
      }
    } catch (e) {
      console.warn("[Together AI Image Gen Fallback]:", e);
    }
  }

  // 2. Attempt Fal.ai (Studio Quality FLUX.1)
  if (falKey) {
    try {
      const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: "square_hd",
          num_inference_steps: 4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const imgUrl = data.images?.[0]?.url;
        if (imgUrl) {
          return {
            success: true,
            imageUrl: imgUrl,
            prompt,
            model: "FLUX.1 Schnell (Fal.ai)",
            source: "huggingface",
          };
        }
      }
    } catch (e) {
      console.warn("[Fal.ai Image Gen Fallback]:", e);
    }
  }

  // 3. Attempt Hugging Face Serverless Router (Official Uncompressed FLUX.1 Dev / Schnell)
  if (hfToken) {
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
                Authorization: `Bearer ${hfToken}`,
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

  // 4. Free High-Resolution Pollinations FLUX Engine (Clean Unenhanced Direct FLUX.1)
  const seed = Math.floor(Math.random() * 1000000);
  const lower = prompt.toLowerCase();

  let selectedModel = requestedModel || "flux";
  if (!requestedModel) {
    if (lower.includes("anime") || lower.includes("manga") || lower.includes("chibi")) {
      selectedModel = "flux-anime";
    } else if (lower.includes("3d") || lower.includes("render") || lower.includes("pixar") || lower.includes("cgi")) {
      selectedModel = "flux-3d";
    } else if (lower.includes("fast") || lower.includes("quick") || lower.includes("turbo")) {
      selectedModel = "turbo";
    } else if (lower.includes("cinematic") || lower.includes("midjourney") || lower.includes("artistic")) {
      selectedModel = "midjourney";
    }
  }

  // Direct clean FLUX.1 render URL (without prompt distortion params)
  const serverlessUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?model=${encodeURIComponent(selectedModel)}&width=1024&height=1024&nologo=true&private=true&seed=${seed}`;

  return {
    success: true,
    imageUrl: serverlessUrl,
    prompt,
    model: selectedModel,
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
