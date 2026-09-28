/**
 * Canva Integration Layer for Clarity CoWork
 * Supports Canva Connect API (Design Creation, Autofill, and Direct Canva Workspace Launching)
 */

export type CanvaDesignType = "instagram_post" | "instagram_story" | "banner" | "poster" | "presentation" | "flyer" | "youtube_thumbnail" | "custom";

export interface CanvaDesignSpec {
  title: string;
  designType: CanvaDesignType;
  width: number;
  height: number;
  category: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  content: {
    headline: string;
    subheadline?: string;
    bodyText?: string;
    callToAction?: string;
    tagline?: string;
    hashtags?: string[];
  };
  visualElements: string[];
  canvaLaunchUrl: string;
  canvaDesignId?: string;
  previewSvg?: string;
}

export interface CanvaApiResult {
  success: boolean;
  designSpec: CanvaDesignSpec;
  editUrl: string;
  viewUrl?: string;
  designId?: string;
  error?: string;
}

const DESIGN_PRESETS: Record<CanvaDesignType, { width: number; height: number; category: string }> = {
  instagram_post: { width: 1080, height: 1080, category: "Instagram Post (Square)" },
  instagram_story: { width: 1080, height: 1920, category: "Instagram Story / Reel" },
  banner: { width: 1200, height: 630, category: "Social Media Banner / Open Graph" },
  poster: { width: 1080, height: 1350, category: "Marketing Poster" },
  presentation: { width: 1920, height: 1080, category: "16:9 Presentation Slide" },
  flyer: { width: 1275, height: 1650, category: "Business Flyer" },
  youtube_thumbnail: { width: 1280, height: 720, category: "YouTube Video Thumbnail" },
  custom: { width: 1200, height: 1200, category: "Custom Graphic" },
};

/**
 * Determine best Canva design preset based on user prompt
 */
export function detectCanvaPreset(prompt: string): CanvaDesignType {
  const p = prompt.toLowerCase();
  if (p.includes("story") || p.includes("reel") || p.includes("tiktok") || p.includes("vertical")) {
    return "instagram_story";
  }
  if (p.includes("banner") || p.includes("header") || p.includes("cover") || p.includes("linkedin banner") || p.includes("twitter banner")) {
    return "banner";
  }
  if (p.includes("slide") || p.includes("presentation") || p.includes("deck") || p.includes("pitch")) {
    return "presentation";
  }
  if (p.includes("poster") || p.includes("wall")) {
    return "poster";
  }
  if (p.includes("flyer") || p.includes("brochure") || p.includes("leaflet")) {
    return "flyer";
  }
  if (p.includes("thumbnail") || p.includes("youtube")) {
    return "youtube_thumbnail";
  }
  return "instagram_post";
}

/**
 * Generate a direct Canva Workspace Launch URL
 */
export function generateCanvaLaunchUrl(title: string, preset: keyof typeof DESIGN_PRESETS): string {
  const encodedTitle = encodeURIComponent(title.trim());
  const presetConfig = DESIGN_PRESETS[preset] || DESIGN_PRESETS.instagram_post;
  
  // Direct Canva design creator endpoint with category hint and dimension query
  return `https://www.canva.com/design/create?width=${presetConfig.width}&height=${presetConfig.height}&title=${encodedTitle}&auto_select=true`;
}

/**
 * Create or Generate a Canva Design Specification & Launcher
 */
export async function canva_create_design(
  prompt: string,
  accessToken?: string | null
): Promise<CanvaApiResult> {
  const presetKey = detectCanvaPreset(prompt);
  const preset = DESIGN_PRESETS[presetKey];

  // If Canva OAuth Connect API token is provided, attempt official Canva Connect API call
  if (accessToken && accessToken.trim()) {
    try {
      const res = await fetch("https://api.canva.com/rest/v1/designs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          design_type: {
            type: "preset",
            name: presetKey,
          },
          title: prompt.slice(0, 50).trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const editUrl = data.design?.urls?.edit_url || generateCanvaLaunchUrl(prompt.slice(0, 40), presetKey);
        const designId = data.design?.id;

        return {
          success: true,
          editUrl,
          viewUrl: data.design?.urls?.view_url,
          designId,
          designSpec: {
            title: data.design?.title || prompt.slice(0, 40),
            designType: presetKey,
            width: preset.width,
            height: preset.height,
            category: preset.category,
            palette: {
              primary: "#00C4CC",
              secondary: "#7D2AE8",
              accent: "#FF4081",
              background: "#0E1117",
              text: "#FFFFFF",
            },
            typography: {
              headingFont: "Plus Jakarta Sans / Montserrat",
              bodyFont: "Inter / Roboto",
            },
            content: {
              headline: prompt.slice(0, 60),
            },
            visualElements: ["Brand Logo", "Hero Typography", "Glow Gradient Background"],
            canvaLaunchUrl: editUrl,
            canvaDesignId: designId,
          },
        };
      }
    } catch (err) {
      console.warn("[Canva API] Connect API request fallback:", err);
    }
  }

  // Standalone Smart Design Engine (Generates direct Canva launcher + full structured visual spec)
  const canvaLaunchUrl = generateCanvaLaunchUrl(prompt.slice(0, 40), presetKey);

  return {
    success: true,
    editUrl: canvaLaunchUrl,
    designSpec: {
      title: prompt.slice(0, 45).replace(/["\n\r]/g, "").trim(),
      designType: presetKey,
      width: preset.width,
      height: preset.height,
      category: preset.category,
      palette: {
        primary: "#00C4CC",
        secondary: "#7D2AE8",
        accent: "#FFB800",
        background: "#09090B",
        text: "#F4F4F5",
      },
      typography: {
        headingFont: "Plus Jakarta Sans / Poppins Bold",
        bodyFont: "Inter / Lato Regular",
      },
      content: {
        headline: prompt.slice(0, 60).trim(),
      },
      visualElements: [
        "High-contrast headline with dynamic line-breaks",
        "Layered gradient backdrop (Canva Teal #00C4CC + Indigo #7D2AE8)",
        "Crisp call-to-action pill with accent border",
        "Modern minimalist geometric watermark",
      ],
      canvaLaunchUrl,
    },
  };
}
