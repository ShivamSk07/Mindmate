"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { CanvaAccountProject } from "@/lib/canva";

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

export default function CanvaStudioView({
  isConnected,
  username,
  onOpenConnectModal,
  onSelectProject,
  onStartDesignPrompt,
  onDisconnectCanva,
}: CanvaStudioViewProps) {
  const [projects, setProjects] = useState<CanvaAccountProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenNotice, setTokenNotice] = useState<string | null>(null);

  const fetchProjects = async (q?: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(searchQuery);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onStartDesignPrompt(customPrompt.trim());
    setIsSubmitting(false);
    setCustomPrompt("");
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
    if (selectedCategory === "presentation") return p.designType.toLowerCase().includes("presentation");
    if (selectedCategory === "instagram_post") return p.designType.toLowerCase().includes("instagram") || p.designType.toLowerCase().includes("post");
    if (selectedCategory === "youtube_thumbnail") return p.designType.toLowerCase().includes("thumbnail");
    if (selectedCategory === "poster") return p.designType.toLowerCase().includes("poster");
    if (selectedCategory === "flyer") return p.designType.toLowerCase().includes("flyer");
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-y-auto">
      {/* ── TOP HERO BANNER ── */}
      <div className="p-6 md:p-8 border-b border-zinc-900 bg-gradient-to-b from-[#00C4CC]/10 via-[#7D2AE8]/5 to-transparent">
        <div className="max-w-6xl mx-auto space-y-6">
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
                  Pro Sync
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-400">
                Explore connected account projects, create presentations, social graphics, and launch verified Canva workspaces.
              </p>
            </div>

            {/* Account Status / Connect Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-300 font-medium">
                  {isConnected ? `@${username || "Canva Workspace"}` : "Account Not Connected"}
                </span>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProjects(searchQuery)}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                    title="Sync projects from Canva"
                  >
                    <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
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
                <span className="text-xs font-semibold text-zinc-200">Connect via Canva Developer Access Token</span>
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
              {tokenNotice && (
                <p className="text-xs text-emerald-400">{tokenNotice}</p>
              )}
            </div>
          )}

          {/* ── AI PROMPT BAR ── */}
          <div className="space-y-3">
            <form onSubmit={handlePromptSubmit} className="relative flex items-center">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask Canva to generate: '6-slide presentation for startup', 'Instagram product poster', 'YouTube thumbnail'..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#00C4CC] rounded-xl pl-4 pr-28 py-3.5 text-xs md:text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all shadow-inner"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:opacity-90 text-white font-semibold text-xs transition-all disabled:opacity-40 shadow-sm"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>Generate</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => onStartDesignPrompt(qp)}
                  className="px-2.5 py-1 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-[11px] text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1"
                >
                  <span>{qp.slice(0, 36)}...</span>
                  <ArrowRight size={10} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACCOUNT PROJECTS EXPLORER ── */}
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
        {isLoading ? (
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
                No designs matched your filter. Try generating a presentation or graphic design with the prompt bar above.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        onClick={() => onSelectProject(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        <Eye size={12} />
                        <span>Inspect in Canvas</span>
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
    </div>
  );
}
