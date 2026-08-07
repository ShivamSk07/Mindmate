"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Sparkles,
  Check,
  Download,
  Trash2,
  Play,
  Star,
  Shield,
  Layers,
  Code2,
  FileText,
  Briefcase,
  TrendingUp,
  Dumbbell,
  DollarSign,
  Compass,
  PenTool,
  Image,
  Youtube,
  Instagram,
  Heart,
  Linkedin
} from "lucide-react";
import type { MiniApp } from "@/types";

interface AppStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (app: MiniApp) => void;
}

export const PREBUILT_MINI_APPS: MiniApp[] = [
  {
    id: "resume-builder",
    name: "Resume Builder",
    description: "Build ATS-friendly, high-impact resumes and CVs tailored for top tech & corporate roles.",
    icon: "FileText",
    category: "Productivity",
    permissions: ["Chat Context", "Export Document"],
    rating: 4.9,
    developer: "Clarity Labs",
    version: "2.1.0",
    systemPrompt: "You are an elite ATS Resume Specialist. Help the user structure, craft, and polish their resume bullets using metric-driven achievements.",
    initialPrompt: "Help me create an ATS-friendly tech resume for a Senior Software Engineer position.",
  },
  {
    id: "website-builder",
    name: "Website Builder",
    description: "Generate complete responsive UI concepts, Tailwind HTML layouts, and site architectures.",
    icon: "Code2",
    category: "Development",
    permissions: ["Chat Context", "Code Execution"],
    rating: 4.8,
    developer: "DevCraft Studios",
    version: "1.4.2",
    systemPrompt: "You are a Master Frontend Web Engineer. Provide clean HTML5, CSS3, Tailwind, and React code for modern web applications.",
    initialPrompt: "Design a high-converting landing page structure for an AI SaaS startup.",
  },
  {
    id: "business-planner",
    name: "Business Planner",
    description: "Draft pitch decks, competitive analysis, monetization models, and go-to-market strategies.",
    icon: "Briefcase",
    category: "Business",
    permissions: ["Chat Context", "Memory Storage"],
    rating: 4.9,
    developer: "VentureAI",
    version: "3.0.1",
    systemPrompt: "You are a Harvard MBA Startup Advisor. Help the user validate business models, analyze unit economics, and write pitch decks.",
    initialPrompt: "Help me write a lean business plan for a B2B SaaS startup.",
  },
  {
    id: "marketing-assistant",
    name: "Marketing Assistant",
    description: "Create viral ad copy, email funnels, launch sequences, and audience targeting strategies.",
    icon: "TrendingUp",
    category: "Marketing",
    permissions: ["Chat Context"],
    rating: 4.7,
    developer: "GrowthEngine",
    version: "1.8.0",
    systemPrompt: "You are a Chief Marketing Officer. Craft persuasive ad copy, email marketing funnels, and viral campaign strategies.",
    initialPrompt: "Create a 7-day launch email funnel for a digital product.",
  },
  {
    id: "fitness-coach",
    name: "Fitness Coach",
    description: "Customized workout routines, macro meal plans, and progressive overload tracking.",
    icon: "Dumbbell",
    category: "Lifestyle",
    permissions: ["Chat Context", "Personal Goals"],
    rating: 4.9,
    developer: "FitPulse AI",
    version: "2.0.0",
    systemPrompt: "You are a Certified Strength & Conditioning Specialist and Nutritionist. Design tailored workout programs and meal plans.",
    initialPrompt: "Build a 4-day workout split for muscle hypertrophy.",
  },
  {
    id: "finance-planner",
    name: "Finance Planner",
    description: "Budget allocation, savings forecasting, debt payoff strategy, and portfolio diversification.",
    icon: "DollarSign",
    category: "Business",
    permissions: ["Chat Context", "Memory Storage"],
    rating: 4.8,
    developer: "CapitalMind",
    version: "1.5.0",
    systemPrompt: "You are a Certified Financial Planner. Help the user optimize personal budgets, track savings goals, and understand investments.",
    initialPrompt: "Create a 50/30/20 monthly budget breakdown for a $5,000 monthly income.",
  },
  {
    id: "travel-planner",
    name: "Travel Planner",
    description: "Curated day-by-day itineraries, flight budget advice, local hidden gems, and packing checklists.",
    icon: "Compass",
    category: "Lifestyle",
    permissions: ["Chat Context"],
    rating: 4.8,
    developer: "Wanderlust AI",
    version: "1.2.1",
    systemPrompt: "You are a Global Travel Expert and Local Guide. Build detailed travel itineraries with restaurant picks, budgets, and local tips.",
    initialPrompt: "Plan a 7-day trip to Tokyo and Kyoto for a budget of $2,500.",
  },
  {
    id: "content-creator",
    name: "Content Creator",
    description: "Hook generation, scriptwriting for Shorts/Reels, blogs, and Twitter/X thread structures.",
    icon: "PenTool",
    category: "Marketing",
    permissions: ["Chat Context"],
    rating: 4.9,
    developer: "CreatorKit",
    version: "2.3.0",
    systemPrompt: "You are a Viral Content Strategist. Generate high-retention hooks, YouTube scripts, and engaging social posts.",
    initialPrompt: "Give me 5 viral hooks and an outline for a 60-second video about Productivity Hacks.",
  },
  {
    id: "coding-assistant",
    name: "Coding Assistant",
    description: "Refactor code, debug stack traces, write unit tests, and explain complex algorithms.",
    icon: "Code2",
    category: "Development",
    permissions: ["Chat Context", "Code Execution"],
    rating: 5.0,
    developer: "Clarity Core",
    version: "4.0.0",
    systemPrompt: "You are a Principal Software Architect. Provide production-grade, bug-free, well-typed code with explanatory comments.",
    initialPrompt: "Review and optimize my React custom hook for API data fetching.",
  },
  {
    id: "image-prompt-generator",
    name: "Image Prompt Generator",
    description: "Craft ultra-detailed Midjourney, DALL-E 3, and Stable Diffusion prompts with art styles.",
    icon: "Image",
    category: "Productivity",
    permissions: ["Chat Context"],
    rating: 4.7,
    developer: "PixelArt AI",
    version: "1.1.0",
    systemPrompt: "You are a Midjourney & DALL-E Prompt Design Specialist. Generate descriptive, cinematic art prompts with camera settings.",
    initialPrompt: "Generate a Midjourney v6 prompt for a futuristic cybernetic city at twilight.",
  },
  {
    id: "youtube-seo-expert",
    name: "YouTube SEO Expert",
    description: "Optimized video titles, high-CTR thumbnail ideas, descriptions, and tag research.",
    icon: "Youtube",
    category: "Marketing",
    permissions: ["Chat Context"],
    rating: 4.8,
    developer: "TubeRank",
    version: "1.9.0",
    systemPrompt: "You are a YouTube SEO Specialist. Generate click-worthy titles, SEO descriptions, and thumbnail concepts.",
    initialPrompt: "Give me 5 high-CTR YouTube titles and thumbnail ideas for a Coding Tutorial video.",
  },
  {
    id: "instagram-growth-expert",
    name: "Instagram Growth Expert",
    description: "Carousel content strategy, caption copywriting, hashtag strategy, and aesthetic layout planning.",
    icon: "Instagram",
    category: "Marketing",
    permissions: ["Chat Context"],
    rating: 4.8,
    developer: "InstaGrow AI",
    version: "2.0.2",
    systemPrompt: "You are an Instagram Growth Strategist. Plan carousels, engaging captions, and hashtag strategies.",
    initialPrompt: "Create a 5-slide carousel outline for '10 AI Tools You Need in 2026'.",
  },
  {
    id: "wedding-planner",
    name: "Wedding Planner",
    description: "Budget estimator, timeline checklists, vendor management, and invitation wording.",
    icon: "Heart",
    category: "Lifestyle",
    permissions: ["Chat Context"],
    rating: 4.9,
    developer: "EverAfter AI",
    version: "1.0.4",
    systemPrompt: "You are a Luxury Wedding Planner. Guide couples through timeline planning, vendor selection, budget allocation, and theme ideas.",
    initialPrompt: "Create a 12-month wedding planning countdown checklist.",
  },
  {
    id: "linkedin-optimizer",
    name: "LinkedIn Optimizer",
    description: "Viral LinkedIn post formats, headline optimization, About section storytelling, and engagement strategy.",
    icon: "Linkedin",
    category: "Productivity",
    permissions: ["Chat Context"],
    rating: 4.9,
    developer: "CareerPulse",
    version: "2.1.0",
    systemPrompt: "You are a LinkedIn Top Voice & Personal Branding Specialist. Write compelling LinkedIn posts and optimize user profiles.",
    initialPrompt: "Rewrite my LinkedIn About summary to position me as an AI Product Manager.",
  },
];

export function AppStoreModal({ isOpen, onClose, onLaunchApp }: AppStoreModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [installedAppIds, setInstalledAppIds] = useState<string[]>([]);

  // Load installed apps from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("clarity_installed_apps");
      if (stored) {
        try {
          setInstalledAppIds(JSON.parse(stored));
        } catch (e) {
          setInstalledAppIds(["coding-assistant", "resume-builder"]);
        }
      } else {
        // Default installed apps
        setInstalledAppIds(["coding-assistant", "resume-builder"]);
      }
    }
  }, []);

  const toggleInstallApp = (appId: string) => {
    let updated: string[];
    if (installedAppIds.includes(appId)) {
      updated = installedAppIds.filter((id) => id !== appId);
    } else {
      updated = [...installedAppIds, appId];
    }
    setInstalledAppIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("clarity_installed_apps", JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  const categories = ["All", "Productivity", "Development", "Marketing", "Business", "Lifestyle"];

  const filteredApps = PREBUILT_MINI_APPS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText": return <FileText size={18} className="text-blue-400" />;
      case "Code2": return <Code2 size={18} className="text-emerald-400" />;
      case "Briefcase": return <Briefcase size={18} className="text-purple-400" />;
      case "TrendingUp": return <TrendingUp size={18} className="text-orange-400" />;
      case "Dumbbell": return <Dumbbell size={18} className="text-rose-400" />;
      case "DollarSign": return <DollarSign size={18} className="text-emerald-400" />;
      case "Compass": return <Compass size={18} className="text-amber-400" />;
      case "PenTool": return <PenTool size={18} className="text-indigo-400" />;
      case "Image": return <Image size={18} className="text-pink-400" />;
      case "Youtube": return <Youtube size={18} className="text-red-500" />;
      case "Instagram": return <Instagram size={18} className="text-pink-500" />;
      case "Heart": return <Heart size={18} className="text-rose-400" />;
      case "Linkedin": return <Linkedin size={18} className="text-sky-400" />;
      default: return <Sparkles size={18} className="text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c0d14] border border-[rgba(255,255,255,0.08)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200">

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-[#11121c]/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Clarity AI App Store</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {PREBUILT_MINI_APPS.length} Apps
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Install specialized mini AI apps to unlock tailored workflows, custom contexts, and specialized capabilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors self-end sm:self-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 py-3.5 bg-[#12131d] border-b border-white/[0.04] flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI mini apps..."
              className="w-full bg-[#08090f] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 scrollbar-thin">
          {filteredApps.map((app) => {
            const isInstalled = installedAppIds.includes(app.id);

            return (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-[#13141f]/90 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between group shadow-md"
              >
                <div>
                  {/* Top Bar: Icon + Rating + Category */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:scale-105 transition-transform">
                        {getIcon(app.icon)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          <span>{app.developer}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-500">v{app.version}</span>
                        </div>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Star size={11} className="fill-amber-400" />
                      {app.rating}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    {app.description}
                  </p>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {app.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-[9px] font-semibold text-zinc-400 bg-white/[0.03] border border-white/[0.04] px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Shield size={9} className="text-indigo-400 opacity-80" />
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions: Install / Uninstall + Launch */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
                  {isInstalled ? (
                    <>
                      <button
                        onClick={() => {
                          onLaunchApp(app);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Play size={12} className="fill-white" />
                        Launch App
                      </button>

                      <button
                        onClick={() => toggleInstallApp(app.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                        title="Uninstall App"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleInstallApp(app.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-white/[0.08]"
                    >
                      <Download size={13} className="text-indigo-400" />
                      Install App
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
