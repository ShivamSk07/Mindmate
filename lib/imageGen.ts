import https from "https";

export interface GeneratedImageResult {
  success: boolean;
  imageUrl: string;
  prompt: string;
  model: string;
  source: "huggingface" | "serverless";
}

/**
 * Extracts requested aspect ratio and computes optimal HD pixel dimensions.
 */
function resolveDimensions(prompt: string): { width: number; height: number; cleanPrompt: string } {
  let clean = prompt;
  const lower = prompt.toLowerCase();

  const arMatch = clean.match(/--ar\s*(\d+:\d+)/i) || clean.match(/\b(16:9|9:16|4:3|3:4|21:9|1:1)\b/i);
  if (arMatch) {
    clean = clean.replace(/--ar\s*\d+:\d+/gi, "").replace(/\b(16:9|9:16|4:3|3:4|21:9|1:1)\b/gi, "").trim();
    const ratio = arMatch[1];
    if (ratio === "16:9") return { width: 1280, height: 720, cleanPrompt: clean };
    if (ratio === "9:16") return { width: 720, height: 1280, cleanPrompt: clean };
    if (ratio === "4:3") return { width: 1152, height: 864, cleanPrompt: clean };
    if (ratio === "3:4") return { width: 864, height: 1152, cleanPrompt: clean };
    if (ratio === "21:9") return { width: 1344, height: 576, cleanPrompt: clean };
    if (ratio === "1:1") return { width: 1024, height: 1024, cleanPrompt: clean };
  }

  if (lower.includes("landscape") || lower.includes("wallpaper") || lower.includes("widescreen") || lower.includes("banner") || lower.includes("horizontal")) {
    return { width: 1280, height: 720, cleanPrompt: clean };
  }
  if (lower.includes("portrait") || lower.includes("vertical") || lower.includes("mobile") || lower.includes("story") || lower.includes("phone wallpaper")) {
    return { width: 720, height: 1280, cleanPrompt: clean };
  }
  if (lower.includes("ultrawide") || lower.includes("cinematic panorama")) {
    return { width: 1344, height: 576, cleanPrompt: clean };
  }

  return { width: 1024, height: 1024, cleanPrompt: clean };
}

/**
 * Automatically boosts prompt quality with photorealism and sharpness tokens.
 */
function enhancePrompt(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Don't double-add quality tokens if already present
  if (lower.includes("hyperrealistic") || lower.includes("ultra sharp") || lower.includes("masterpiece")) {
    return prompt;
  }

  const isAnime = lower.includes("anime") || lower.includes("manga") || lower.includes("chibi");
  const is3D = lower.includes("3d") || lower.includes("render") || lower.includes("pixar");

  if (isAnime) {
    return `${prompt}, masterpiece, best quality, ultra detailed, sharp focus, vibrant colors, 8k resolution`;
  }
  if (is3D) {
    return `${prompt}, octane render, ultra detailed, 8k resolution, sharp focus, studio lighting, high quality`;
  }

  // Default: photorealistic enhancement
  return `${prompt}, hyperrealistic, ultra sharp, 8k resolution, professional photography, HDR, high detail, photorealistic lighting, RAW photo quality`;
}

/**
 * Image Generation Engine.
 * Priority: Together AI → Fal.ai → Pollinations (Midjourney v6 + enhance=true)
 */
export async function generateFluxImage(rawPrompt: string, requestedModel?: string): Promise<GeneratedImageResult> {
  const { width, height, cleanPrompt } = resolveDimensions(rawPrompt.trim());
  const basePrompt = cleanPrompt || rawPrompt.trim();
  const prompt = enhancePrompt(basePrompt);

  const siliconKey = process.env.SILICONFLOW_API_KEY || "";
  const togetherKey = process.env.TOGETHER_API_KEY || "";
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY || "";

  // 1. SiliconFlow (FLUX.1 Studio Ultra-HD)
  if (siliconKey) {
    try {
      // Normalize dimensions to SiliconFlow supported resolutions
      let imageSize = "1024x1024";
      if (width > height) imageSize = "1024x768";
      else if (height > width) imageSize = "768x1024";

      const res = await fetch("https://api.siliconflow.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${siliconKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell",
          prompt,
          image_size: imageSize,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const imgUrl = data.images?.[0]?.url;
        if (imgUrl) {
          return {
            success: true,
            imageUrl: imgUrl,
            prompt: basePrompt,
            model: "FLUX.1 Schnell (SiliconFlow Ultra-HD)",
            source: "huggingface",
          };
        }
      } else {
        console.warn("[SiliconFlow Response Status]:", res.status);
      }
    } catch (e) {
      console.warn("[SiliconFlow Image Gen Fallback]:", e);
    }
  }

  // 2. Together AI (paid key required)
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
          prompt,
          width,
          height,
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
            prompt: basePrompt,
            model: "FLUX.1 Schnell (Together AI)",
            source: "huggingface",
          };
        }
      }
    } catch (e) {
      console.warn("[Together AI Image Gen Fallback]:", e);
    }
  }

  // 2. Fal.ai (paid key required)
  if (falKey) {
    try {
      const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: { width, height },
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
            prompt: basePrompt,
            model: "FLUX.1 Schnell (Fal.ai)",
            source: "huggingface",
          };
        }
      }
    } catch (e) {
      console.warn("[Fal.ai Image Gen Fallback]:", e);
    }
  }

  // 3. Free — Pollinations Midjourney v6 with enhance=true (best free available)
  const seed = Math.floor(Math.random() * 1000000);
  const lower = prompt.toLowerCase();

  let selectedModel = requestedModel || "midjourney";
  if (!requestedModel) {
    if (lower.includes("anime") || lower.includes("manga") || lower.includes("chibi")) {
      selectedModel = "flux-anime";
    } else if (lower.includes("3d") || lower.includes("render") || lower.includes("pixar") || lower.includes("cgi")) {
      selectedModel = "flux-3d";
    } else if (lower.includes("turbo") || lower.includes("sdxl")) {
      selectedModel = "turbo";
    } else if (lower.includes("flux")) {
      selectedModel = "flux";
    }
  }

  // enhance=true → Pollinations internally auto-expands prompt for sharper output
  const serverlessUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?model=${encodeURIComponent(selectedModel)}&width=${width}&height=${height}&nologo=true&private=true&enhance=true&seed=${seed}`;

  return {
    success: true,
    imageUrl: serverlessUrl,
    prompt: basePrompt,
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

  // 2. Natural language triggers
  const nlMatch = trimmed.match(
    /^(?:please\s+)?(?:generate|draw|create|make|paint|render)\s+(?:an?\s+)?(?:image|picture|photo|illustration|art|painting|portrait)\s+(?:of|showing|with|depicting)\s+(.+)$/i
  );
  if (nlMatch) {
    return { isImage: true, prompt: nlMatch[1].trim() };
  }

  return { isImage: false, prompt: "" };
}
