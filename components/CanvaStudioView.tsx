"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Search,
  ExternalLink,
  RefreshCw,
  Plus,
  Play,
  Presentation,
  Image as ImageIcon,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  Copy,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Eye,
  ArrowLeft,
  X,
  Sliders,
  Maximize2,
} from "lucide-react";
import { CanvaAccountProject, CanvaDesignSpec } from "@/lib/canva";
import CanvaDesignViewer from "@/components/CanvaDesignViewer";

interface CanvaStudioViewProps {
  isConnected: boolean;
  username: string | null;
  onOpenConnectModal: () => void;
  onSelectProject: (project: CanvaAccountProject) => void;
  onStartDesignPrompt: (prompt: string) => void;
  onDisconnectCanva: () => void;
}

const CATEGORY_TABS = [
  { id: "all", label: "All Designs" },
  { id: "presentation", label: "Presentations (PPT)" },
  { id: "instagram_post", label: "Social Posts" },
  { id: "youtube_thumbnail", label: "Thumbnails" },
  { id: "poster", label: "Posters" },
  { id: "flyer", label: "Flyers" },
];

const QUICK_PROMPTS = [
  "Create a 6-slide investor pitch deck for an AI healthcare startup",
  "Generate a modern dark-mode Instagram post for a SaaS product launch",
  "Design a high-contrast viral YouTube thumbnail for a coding tutorial",
  "Create an executive business flyer for a tech conference 2026",
  "Design an elegant LinkedIn banner for senior engineering leadership",
];

const GENERATION_STEPS = [
  { step: 1, label: "Analyzing creative direction & format requirements" },
  { step: 2, label: "Structuring presentation slides & typographic layout" },
  { step: 3, label: "Generating visual assets & color harmony" },
  { step: 4, label: "Configuring Canva project & workspace sync" },
];

export default function CanvaStudioView({
  isConnected,
  username,
  onOpenConnectModal,
  onSelectProject,
  onStartDesignPrompt,
  onDisconnectCanva,
}: CanvaStudioViewProps) {
  const [projects, setProjects] = useState<CanvaAccountProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customPrompt, setCustomPrompt] = useState("");

  // In-Studio Active Design & Generation State
  const [activeDesign, setActiveDesign] = useState<CanvaDesignSpec | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "canvas">("projects");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Token Drawer State
  const [manualToken, setManualToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<string | null>(null);

  const fetchProjects = async (q?: string) => {
    setIsLoadingProjects(true);
    try {
      const url = `/api/cowork/canva/projects${q ? `?query=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.warn("Failed to fetch Canva projects:", e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(searchQuery);
  };

  // Direct In-Studio Design Generation
  const handleCreateDesign = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;
    const cleanPrompt = promptText.trim();

    setIsGenerating(true);
    setGenerationPrompt(cleanPrompt);
    setGenerationStep(0);
    setGenerationError(null);
    setActiveTab("canvas");

    // Progress through generation steps smoothly
    let currentStep = 0;
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = setInterval(() => {
      currentStep += 1;
      if (currentStep < GENERATION_STEPS.length) {
        setGenerationStep(currentStep);
      }
    }, 1200);

    try {
      const res = await fetch("/api/cowork/canva/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate design in Canva Studio");
      }

      const designSpec: CanvaDesignSpec = data.design;
      setGenerationStep(GENERATION_STEPS.length - 1);
      setActiveDesign(designSpec);
      setCustomPrompt("");

      // Add to projects list so it appears in the account library
      const newProj: CanvaAccountProject = {
        id: designSpec.canvaDesignId || `canva_gen_${Date.now()}`,
        title: designSpec.title,
        thumbnailUrl: designSpec.previewImageUrl || designSpec.slides?.[0]?.imageUrl,
        editUrl: data.editUrl || designSpec.canvaLaunchUrl,
        viewUrl: designSpec.canvaTemplateSearchUrl,
        designType: designSpec.designType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
    } catch (err: any) {
      setGenerationError(err.message || "Failed to create Canva design");
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
    }
  };

  const handlePromptFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleCreateDesign(customPrompt);
  };

  // Inspect existing project right inside Canva Studio
  const handleInspectProjectInStudio = (p: CanvaAccountProject) => {
    const isPres = p.designType.toLowerCase().includes("presentation");
    const syntheticSpec: CanvaDesignSpec = {
      title: p.title,
      designType: (isPres ? "presentation" : "custom") as any,
      width: isPres ? 1920 : 1080,
      height: isPres ? 1080 : 1080,
      category: isPres ? "16:9 Presentation Pitch Deck" : "Canva Design",
      palette: {
        primary: "#00C4CC",
        secondary: "#7D2AE8",
        accent: "#FFB800",
        background: "#09090B",
        cardBg: "#18181B",
        text: "#FFFFFF",
        mutedText: "#A1A1AA",
      },
      typography: {
        headingFont: "Plus Jakarta Sans Bold",
        bodyFont: "Inter Regular",
      },
      content: {
        headline: p.title,
        subheadline: "Synced directly from your connected Canva Account",
        callToAction: "Open Design in Canva Workspace",
        badge: "Canva Account Sync",
      },
      canvaLaunchUrl: p.editUrl,
      canvaTemplateSearchUrl: `https://www.canva.com/search?q=${encodeURIComponent(p.title)}`,
      canvaMagicDesignUrl: `https://www.canva.com/magic-design/?query=${encodeURIComponent(p.title)}`,
      canvaBlankCanvasUrl: p.editUrl,
      canvaDocToDeckUrl: "https://www.canva.com/create/documents/",
      previewImageUrl: p.thumbnailUrl,
      isRealCanvaDesign: true,
      visualElements: ["High Contrast Hero", "Canva Typography", "Synced Workspace"],
    };

    if (isPres) {
      syntheticSpec.slides = [
        {
          slideNumber: 1,
          title: p.title,
          subtitle: "Live Project from your Canva Account",
          layout: "cover",
          bullets: [
            "Synchronized with Canva Cloud Storage",
            "Full 16:9 widescreen presentation deck",
            "One-click direct workspace launching & collaboration",
          ],
          speakerNotes: "Click 'Open in Canva' to edit this live in Canva Workspace.",
          visualDescription: "Cloud design thumbnail from Canva.",
          imageUrl: p.thumbnailUrl,
        },
        {
          slideNumber: 2,
          title: "Key Highlights & Strategic Focus",
          subtitle: "Core objectives and measurable milestones",
          layout: "split",
          bullets: [
            "Streamlined design collaboration",
            "Real-time team editing and commenting",
            "Direct export to PDF, PowerPoint, and MP4",
          ],
          speakerNotes: "Discuss the primary deliverables.",
          visualDescription: "Split content and metric cards.",
          imageUrl: p.thumbnailUrl,
        },
      ];
    }

    setActiveDesign(syntheticSpec);
    setActiveTab("canvas");
  };

  const handleSaveManualToken = async () => {
    if (!manualToken.trim()) return;
    setIsSavingToken(true);
    setTokenNotice(null);
    try {
      const res = await fetch("/api/cowork/canva/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manualToken.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenNotice("Canva account connected successfully!");
        setShowTokenInput(false);
        fetchProjects();
      } else {
        setTokenNotice(data.error || "Failed to connect with provided token");
      }
    } catch (e: any) {
      setTokenNotice(e.message || "Failed to connect token");
    } finally {
      setIsSavingToken(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "presentation")
      return p.designType.toLowerCase().includes("presentation");
    if (selectedCategory === "instagram_post")
      return (
        p.designType.toLowerCase().includes("instagram") ||
        p.designType.toLowerCase().includes("post")
      );
    if (selectedCategory === "youtube_thumbnail")
      return p.designType.toLowerCase().includes("thumbnail");
    if (selectedCategory === "poster") return p.designType.toLowerCase().includes("poster");
    if (selectedCategory === "flyer") return p.designType.toLowerCase().includes("flyer");
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* ── TOP HERO BANNER & AI PROMPT BAR ── */}
      <div className="p-5 md:p-7 border-b border-zinc-900 bg-gradient-to-b from-[#00C4CC]/10 via-[#7D2AE8]/5 to-transparent flex-shrink-0">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,196,204,0.3)]">
                  <Palette size={16} />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Canva Design Studio
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase tracking-wider">
                  Live Creator
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-400">
                Prompt anything to generate interactive presentations, decks, posters & graphics directly in Canva Studio.
              </p>
            </div>

            {/* Account Status / Connect Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-300 font-medium">
                  {isConnected ? `@${username || "Canva Workspace"}` : "Canva Connected"}
                </span>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProjects(searchQuery)}
                    disabled={isLoadingProjects}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                    title="Sync projects from Canva"
                  >
                    <RefreshCw size={13} className={isLoadingProjects ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={onDisconnectCanva}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenConnectModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:opacity-90 text-white text-xs font-semibold transition-opacity shadow-sm"
                  >
                    <Palette size={13} />
                    <span>Connect Canva</span>
                  </button>
                  <button
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Token
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Token Drawer if clicked */}
          {showTokenInput && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Connect via Canva Developer Access Token
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">From canva.dev developer portal</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste Canva Access Token (e.g. cnva_pat_...)"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#00C4CC]"
                />
                <button
                  onClick={handleSaveManualToken}
                  disabled={isSavingToken || !manualToken.trim()}
                  className="px-3 py-2 rounded-lg bg-[#00C4CC] text-zinc-950 font-semibold text-xs hover:opacity-90 disabled:opacity-40"
                >
                  {isSavingToken ? <Loader2 size={13} className="animate-spin" /> : "Save Token"}
                </button>
              </div>
              {tokenNotice && <p className="text-xs text-emerald-400">{tokenNotice}</p>}
            </div>
          )}

          {/* ── AI PROMPT BAR (CREATES DIRECTLY IN CANVA STUDIO) ── */}
          <div className="space-y-3">
            <form onSubmit={handlePromptFormSubmit} className="relative flex items-center">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask Canva Studio to make: '6-slide presentation for startup', 'Instagram product poster', 'YouTube thumbnail'..."
                disabled={isGenerating}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#00C4CC] rounded-xl pl-4 pr-32 py-3.5 text-xs md:text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-inner disabled:opacity-50"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:opacity-90 text-white font-semibold text-xs transition-all disabled:opacity-40 shadow-sm"
                >
                  {isGenerating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span>{isGenerating ? "Designing..." : "Create Design"}</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">
                Prompt Suggestions:
              </span>
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleCreateDesign(qp)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 disabled:opacity-40"
                >
                  <span>{qp.slice(0, 36)}...</span>
                  <ArrowRight size={10} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>

          {/* ── STUDIO SUB-NAVIGATION TABS ── */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
            <div className="flex items-center gap-2">
              {activeDesign && (
                <button
                  onClick={() => setActiveTab("canvas")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "canvas"
                      ? "bg-gradient-to-r from-[#00C4CC]/20 to-[#7D2AE8]/20 border border-[#00C4CC]/50 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-transparent"
                  }`}
                >
                  <Eye size={13} className="text-[#00C4CC]" />
                  <span>Interactive Canvas</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#00C4CC]/20 text-[#00C4CC] font-mono">
                    Live
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "projects"
                    ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-transparent"
                }`}
              >
                <FolderOpen size={13} />
                <span>Canva Projects</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">
                  {projects.length}
                </span>
              </button>
            </div>

            {activeDesign && activeTab === "canvas" && (
              <div className="flex items-center gap-2">
                <a
                  href={activeDesign.canvaLaunchUrl || "https://www.canva.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Palette size={12} />
                  <span>Open & Edit in Canva</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN STUDIO BODY: EITHER LIVE GENERATION / CANVAS OR PROJECTS ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* State 1: Active Generating Animation */}
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-xl mx-auto my-auto animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00C4CC] via-[#7D2AE8] to-purple-600 flex items-center justify-center text-white shadow-[0_0_35px_rgba(0,196,204,0.4)] animate-pulse">
                <Palette size={28} />
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4CC] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00C4CC]"></span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Canva Studio is Designing...
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto line-clamp-2 italic bg-zinc-950 px-3.5 py-2 rounded-lg border border-zinc-850 text-zinc-300">
                “{generationPrompt}”
              </p>
            </div>

            {/* Step progress list */}
            <div className="w-full space-y-2.5 bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl text-left">
              {GENERATION_STEPS.map((s, idx) => {
                const isCompleted = generationStep > idx;
                const isCurrent = generationStep === idx;
                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-3 text-xs transition-all ${
                      isCompleted
                        ? "text-emerald-400 font-medium"
                        : isCurrent
                        ? "text-zinc-100 font-semibold"
                        : "text-zinc-600"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 size={15} className="text-[#00C4CC] animate-spin" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 mx-auto" />
                      )}
                    </div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-500 font-mono">
              Creating visual layout and interactive preview...
            </p>
          </div>
        ) : generationError ? (
          <div className="p-8 max-w-lg mx-auto my-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">Design Generation Notice</h3>
              <p className="text-xs text-zinc-400">{generationError}</p>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white"
            >
              Back to Studio
            </button>
          </div>
        ) : activeTab === "canvas" && activeDesign ? (
          /* State 2: Interactive Canva Canvas Viewer */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CanvaDesignViewer content={JSON.stringify(activeDesign)} />
          </div>
        ) : (
          /* State 3: Canva Projects Grid */
          <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === tab.id
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Canva designs..."
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-600" />
              </form>
            </div>

            {/* Projects Grid */}
            {isLoadingProjects ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
                <Loader2 size={24} className="animate-spin text-[#00C4CC]" />
                <p className="text-xs">Fetching Canva account designs...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-zinc-900 bg-zinc-950/50 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                  <FolderOpen size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-300">No Canva designs found</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Type a prompt in the creator bar above to design your first presentation or marketing graphic in Canva Studio.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
                {filteredProjects.map((p) => {
                  const isPres = p.designType.toLowerCase().includes("presentation");
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-zinc-850 bg-zinc-950 hover:border-zinc-700 transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    >
                      {/* Thumbnail Banner */}
                      <div className="relative aspect-[16/9] w-full bg-zinc-900 overflow-hidden border-b border-zinc-850/80">
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600 space-y-2">
                            {isPres ? <Presentation size={24} /> : <ImageIcon size={24} />}
                            <span className="text-[11px] font-mono uppercase text-zinc-500">
                              {p.designType}
                            </span>
                          </div>
                        )}

                        {/* Category pill */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-zinc-200 border border-white/10">
                            {p.designType}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                            {p.title}
                          </h3>
                          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                            Updated {new Date(p.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                          <button
                            onClick={() => handleInspectProjectInStudio(p)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                          >
                            <Eye size={12} />
                            <span>Inspect in Studio</span>
                          </button>

                          <a
                            href={p.editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC]/20 to-[#7D2AE8]/20 hover:from-[#00C4CC]/40 hover:to-[#7D2AE8]/40 border border-[#00C4CC]/30 text-white transition-all"
                            title="Open directly in Canva"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
