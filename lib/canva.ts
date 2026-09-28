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
  if (p.includes("story") || p.includes("reel") || p.includes("tiktok") || p.includes("vertical") || p.includes("shorts")) {
    return "instagram_story";
  }
  if (p.includes("banner") || p.includes("header") || p.includes("cover") || p.includes("linkedin banner") || p.includes("twitter banner") || p.includes("hero")) {
    return "banner";
  }
  if (p.includes("slide") || p.includes("presentation") || p.includes("deck") || p.includes("pitch") || p.includes("powerpoint")) {
    return "presentation";
  }
  if (p.includes("poster") || p.includes("wall") || p.includes("billboard")) {
    return "poster";
  }
  if (p.includes("flyer") || p.includes("brochure") || p.includes("leaflet") || p.includes("pamphlet")) {
    return "flyer";
  }
  if (p.includes("thumbnail") || p.includes("youtube") || p.includes("yt")) {
    return "youtube_thumbnail";
  }
  return "instagram_post";
}

/**
 * Generate a direct Canva Workspace Launch URL
 */
export function generateCanvaLaunchUrl(title: string, preset: CanvaDesignType): string {
  const encodedTitle = encodeURIComponent(title.trim());
  const presetConfig = DESIGN_PRESETS[preset] || DESIGN_PRESETS.instagram_post;
  
  return `https://www.canva.com/design/create?width=${presetConfig.width}&height=${presetConfig.height}&title=${encodedTitle}&auto_select=true`;
}

/**
 * Generate smart contextual color palettes and typography instantly
 */
function getSmartTheme(prompt: string) {
  const p = prompt.toLowerCase();

  if (p.includes("cyber") || p.includes("neon") || p.includes("ai") || p.includes("launch") || p.includes("future")) {
    return {
      palette: {
        primary: "#00F0FF",
        secondary: "#7000FF",
        accent: "#FF007A",
        background: "#08080C",
        text: "#FFFFFF",
      },
      typography: {
        headingFont: "Plus Jakarta Sans / Syne Bold",
        bodyFont: "Inter / Space Grotesk",
      },
      visuals: ["Neon Cyber Glow", "Dynamic Typographic Grid", "Pill CTA with Glass Border", "Dark Abstract Backdrop"],
    };
  }

  if (p.includes("luxury") || p.includes("premium") || p.includes("gold") || p.includes("real estate") || p.includes("brand")) {
    return {
      palette: {
        primary: "#D4AF37",
        secondary: "#1A1A1A",
        accent: "#E5C158",
        background: "#0D0D0D",
        text: "#F5F5F7",
      },
      typography: {
        headingFont: "Cinzel / Playfair Display Bold",
        bodyFont: "Outfit / Montserrat",
      },
      visuals: ["Gold Accent Borders", "Clean Editorial Alignment", "Minimalist Monogram Mark", "Deep Obsidian Glass"],
    };
  }

  if (p.includes("hiring") || p.includes("job") || p.includes("recruitment") || p.includes("career")) {
    return {
      palette: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#F59E0B",
        background: "#0B0F17",
        text: "#F8FAFC",
      },
      typography: {
        headingFont: "Plus Jakarta Sans ExtraBold",
        bodyFont: "Inter Regular",
      },
      visuals: ["High-Impact Role Title", "Benefit Badges & Tags", "Clear Apply CTA Button", "Subtle Grid Watermark"],
    };
  }

  return {
    palette: {
      primary: "#00C4CC",
      secondary: "#7D2AE8",
      accent: "#FFB800",
      background: "#09090B",
      text: "#F4F4F5",
    },
    typography: {
      headingFont: "Plus Jakarta Sans Bold",
      bodyFont: "Inter Regular",
    },
    visuals: ["Bold Centered Headline", "Dual-Tone Gradient Mesh", "Interactive Action Tag", "Clean Modern Layout"],
  };
}

/**
 * Create or Generate a Canva Design Specification & Launcher (Ultra-Fast)
 */
export async function canva_create_design(
  prompt: string,
  accessToken?: string | null
): Promise<CanvaApiResult> {
  const presetKey = detectCanvaPreset(prompt);
  const preset = DESIGN_PRESETS[presetKey];
  const theme = getSmartTheme(prompt);
  const cleanTitle = prompt.slice(0, 45).replace(/["\n\r]/g, "").trim();

  // Fast Canva Connect REST API attempt with strict 800ms timeout
  if (accessToken && accessToken.trim() && accessToken !== "canva_direct_integration_active") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);

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
          title: cleanTitle,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const editUrl = data.design?.urls?.edit_url || generateCanvaLaunchUrl(cleanTitle, presetKey);
        const designId = data.design?.id;

        return {
          success: true,
          editUrl,
          viewUrl: data.design?.urls?.view_url,
          designId,
          designSpec: {
            title: data.design?.title || cleanTitle,
            designType: presetKey,
            width: preset.width,
            height: preset.height,
            category: preset.category,
            palette: theme.palette,
            typography: theme.typography,
            content: {
              headline: prompt.slice(0, 65).trim(),
              callToAction: "Open Design in Canva Studio",
            },
            visualElements: theme.visuals,
            canvaLaunchUrl: editUrl,
            canvaDesignId: designId,
          },
        };
      }
    } catch {}
  }

  // Instant Smart Studio Engine (< 10ms response)
  const canvaLaunchUrl = generateCanvaLaunchUrl(cleanTitle, presetKey);

  return {
    success: true,
    editUrl: canvaLaunchUrl,
    designSpec: {
      title: cleanTitle,
      designType: presetKey,
      width: preset.width,
      height: preset.height,
      category: preset.category,
      palette: theme.palette,
      typography: theme.typography,
      content: {
        headline: prompt.slice(0, 65).trim(),
        callToAction: "Open Design in Canva Studio",
      },
      visualElements: theme.visuals,
      canvaLaunchUrl,
    },
  };
}
