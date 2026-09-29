"use client";

import React, { useState } from "react";
import {
  Palette,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  Sparkles,
  Presentation,
  SlidersHorizontal,
  Layers,
  FileText,
  Search,
} from "lucide-react";
import { CanvaDesignSpec, CanvaSlide } from "@/lib/canva";

interface CanvaDesignViewerProps {
  content: string;
}

export default function CanvaDesignViewer({ content }: CanvaDesignViewerProps) {
  let spec: CanvaDesignSpec | null = null;
  try {
    spec = JSON.parse(content);
  } catch (e) {
    return (
      <div className="p-8 text-zinc-400">
        <p className="text-sm font-semibold text-zinc-300">Design Specification:</p>
        <pre className="mt-2 font-mono text-xs bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-zinc-300 overflow-x-auto">
          {content}
        </pre>
      </div>
    );
  }

  if (!spec) return null;

  const isPresentation =
    spec.designType === "presentation" ||
    (Array.isArray(spec.slides) && spec.slides.length > 0);

  return isPresentation ? (
    <PresentationDeckViewer spec={spec} />
  ) : (
    <GraphicDesignViewer spec={spec} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentation Deck Viewer (16:9 Multi-Slide Canvas)
// ─────────────────────────────────────────────────────────────────────────────
function PresentationDeckViewer({ spec }: { spec: CanvaDesignSpec }) {
  const slides: CanvaSlide[] = spec.slides || [];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [copiedSlideDeck, setCopiedSlideDeck] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  const activeSlide: CanvaSlide | undefined = slides[activeSlideIndex] || {
    slideNumber: 1,
    title: spec.title,
    subtitle: spec.content?.headline,
    layout: "cover",
    bullets: spec.content?.bulletPoints || [],
    speakerNotes: "Welcome audience and introduce key theme.",
    visualDescription: "Hero presentation cover slide.",
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  const copyEntireDeckMarkdown = () => {
    const md = [
      `# ${spec.title}`,
      `**Theme**: ${spec.category} | **Palette**: ${spec.palette.primary}, ${spec.palette.secondary}`,
      `**Canva Workspace Link**: ${spec.canvaLaunchUrl}`,
      `**Canva Templates Link**: ${spec.canvaTemplateSearchUrl}`,
      "",
      "---",
      "",
      ...slides.map(
        (s) =>
          `## Slide ${s.slideNumber}: ${s.title}\n*${s.subtitle || ""}*\n\n${(s.bullets || []).map((b) => `- ${b}`).join("\n")}\n\n> **Speaker Notes**: ${s.speakerNotes || "N/A"}\n\n**Visual Guidance**: ${s.visualDescription || "Modern 16:9 slide"}\n\n---`
      ),
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopiedSlideDeck(true);
    setTimeout(() => setCopiedSlideDeck(false), 2000);
  };

  const downloadDeckMarkdown = () => {
    const md = [
      `# ${spec.title}`,
      `**Canva Workspace Link**: ${spec.canvaLaunchUrl}`,
      `**Canva Templates**: ${spec.canvaTemplateSearchUrl}`,
      "",
      ...slides.map(
        (s) =>
          `## Slide ${s.slideNumber}: ${s.title}\n*${s.subtitle || ""}*\n\n${(s.bullets || []).map((b) => `- ${b}`).join("\n")}\n\n> Speaker Notes: ${s.speakerNotes || ""}\n\n---\n`
      ),
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Presentation.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto w-full h-full p-5 md:p-7 space-y-5 bg-[#0a0a0b]">
      {/* Top Banner with Direct Canva Link & Controls */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#00C4CC]/20 via-[#7D2AE8]/20 to-zinc-950 border border-[#00C4CC]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white flex items-center gap-1 shadow-sm">
              <Presentation size={10} />
              <span>Canva Presentation Studio</span>
            </span>
            {spec.isRealCanvaDesign && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Account Design
              </span>
            )}
            <span className="text-xs text-zinc-400 font-mono">
              16:9 • {slides.length > 0 ? `${slides.length} Slides Deck` : "Full Presentation"}
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{spec.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyEntireDeckMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all"
            title="Copy entire slide deck as markdown"
          >
            {copiedSlideDeck ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copiedSlideDeck ? "Copied Deck" : "Copy Deck"}</span>
          </button>

          <button
            onClick={downloadDeckMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all"
            title="Download slide deck file"
          >
            <Download size={12} />
            <span>Export .md</span>
          </button>

          <a
            href={spec.canvaLaunchUrl || "https://www.canva.com/create/presentations/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white text-xs font-semibold hover:opacity-95 transition-all shadow-[0_4px_16px_rgba(0,196,204,0.35)] active:scale-95 flex-shrink-0"
          >
            <Palette size={13} />
            <span>Open in Canva</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main 16:9 Presentation Canvas Stage */}
      <div className="relative rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden aspect-[16/9] max-h-[460px] w-full flex flex-col justify-between p-6 md:p-8"
        style={{
          backgroundColor: spec.palette.background || "#08080C",
        }}
      >
        {/* Ambient Gradient Glow */}
        <div
          className="absolute -top-16 -right-16 w-80 h-80 opacity-20 pointer-events-none rounded-full blur-3xl"
          style={{ backgroundColor: spec.palette.primary || "#00C4CC" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-80 h-80 opacity-15 pointer-events-none rounded-full blur-3xl"
          style={{ backgroundColor: spec.palette.secondary || "#7D2AE8" }}
        />

        {/* Slide Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shadow-sm"
              style={{
                backgroundColor: spec.palette.primary || "#00C4CC",
                color: "#000000",
              }}
            >
              Slide {activeSlide.slideNumber} of {slides.length}
            </span>
            <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
              {activeSlide.layout.toUpperCase()} LAYOUT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest hidden sm:inline">
              1920 × 1080 PX
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: spec.palette.primary || "#00C4CC" }}
            />
          </div>
        </div>

        {/* Slide Center Content */}
        <div className="relative z-10 my-auto py-3 space-y-4">
          <div className="space-y-1.5">
            <h1
              className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight"
              style={{
                color: spec.palette.text || "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {activeSlide.title}
            </h1>
            {activeSlide.subtitle && (
              <p
                className="text-sm md:text-base font-normal leading-relaxed max-w-2xl"
                style={{ color: spec.palette.mutedText || "#A1A1AA" }}
              >
                {activeSlide.subtitle}
              </p>
            )}
          </div>

          {/* Dynamic Layout Details */}
          {activeSlide.metrics && activeSlide.metrics.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {activeSlide.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-white/10 shadow-inner flex flex-col justify-center"
                  style={{ backgroundColor: spec.palette.cardBg || "#12121A" }}
                >
                  <span
                    className="text-xl md:text-2xl font-black tracking-tight"
                    style={{ color: spec.palette.primary || "#00C4CC" }}
                  >
                    {m.value}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          ) : activeSlide.bullets && activeSlide.bullets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {activeSlide.bullets.slice(0, 4).map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-white/10 flex items-start gap-2.5 shadow-sm"
                  style={{ backgroundColor: spec.palette.cardBg || "#12121A" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: spec.palette.primary || "#00C4CC" }}
                  />
                  <span className="text-xs md:text-sm text-zinc-200 font-medium leading-relaxed">
                    {b}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Slide Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Visuals:</span>
            <span className="truncate max-w-[280px] sm:max-w-md text-zinc-300">
              {activeSlide.visualDescription || "Modern minimalist vector graphics"}
            </span>
          </div>

          {/* Prev / Next Slide Quick Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevSlide}
              disabled={activeSlideIndex === 0}
              className="p-1 rounded-md bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-mono text-zinc-400 px-1">
              {activeSlideIndex + 1}/{slides.length}
            </span>
            <button
              onClick={handleNextSlide}
              disabled={activeSlideIndex === slides.length - 1}
              className="p-1 rounded-md bg-zinc-900/80 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Thumbnails Carousel Switcher */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-[#00C4CC]" />
            Slide Deck Navigation ({slides.length} Slides)
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Click any slide to view</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlideIndex(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[75px] ${
                activeSlideIndex === idx
                  ? "bg-zinc-900 border-[#00C4CC] shadow-[0_0_15px_rgba(0,196,204,0.25)] ring-1 ring-[#00C4CC]"
                  : "bg-zinc-950 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono font-bold text-zinc-400 group-hover:text-white">
                  Slide {s.slideNumber}
                </span>
                <span className="text-[9px] uppercase font-mono text-zinc-600 px-1 rounded bg-zinc-900">
                  {s.layout}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-200 line-clamp-2 leading-tight">
                {s.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Notes & Canva Recommended Assets Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Speaker Talking Points */}
        <div className="md:col-span-7 p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <FileText size={13} className="text-violet-400" />
              Presenter Talking Points (Slide {activeSlide.slideNumber})
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeSlide.speakerNotes || "");
                setCopiedNotes(true);
                setTimeout(() => setCopiedNotes(false), 2000);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              {copiedNotes ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copiedNotes ? "Copied" : "Copy Notes"}</span>
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
            {activeSlide.speakerNotes || "Emphasize key problem solving and scalable benefits."}
          </p>
        </div>

        {/* Right: Canva Search Tags */}
        <div className="md:col-span-5 p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2.5">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Search size={13} className="text-[#00C4CC]" />
            Recommended Canva Elements
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(activeSlide.suggestedElements || ["pitch deck", "infographic", "gradient", "3d icon"]).map(
              (tag, idx) => (
                <a
                  key={idx}
                  href={`https://www.canva.com/search?q=${encodeURIComponent(tag)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>#{tag}</span>
                  <ExternalLink size={9} className="opacity-50" />
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Graphic Design Viewer (Instagram, YouTube Thumbnail, Banner, Poster, Flyer)
// ─────────────────────────────────────────────────────────────────────────────
function GraphicDesignViewer({ spec }: { spec: CanvaDesignSpec }) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedCopy, setCopiedCopy] = useState(false);

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const copyAllCopy = () => {
    const text = [
      spec.content?.headline ? `Headline: ${spec.content.headline}` : "",
      spec.content?.subheadline ? `Subheadline: ${spec.content.subheadline}` : "",
      spec.content?.bodyText ? `Body: ${spec.content.bodyText}` : "",
      spec.content?.callToAction ? `CTA: ${spec.content.callToAction}` : "",
      spec.content?.hashtags ? `Hashtags: ${spec.content.hashtags.join(" ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCopy(true);
    setTimeout(() => setCopiedCopy(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto w-full h-full p-6 md:p-8 space-y-6 bg-[#0a0a0b]">
      {/* Top Banner with Direct Canva Link */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#00C4CC]/15 via-[#7D2AE8]/15 to-transparent border border-[#00C4CC]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white">
              Canva Studio
            </span>
            {spec.isRealCanvaDesign && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected Design
              </span>
            )}
            <span className="text-xs text-zinc-400">
              {spec.category} • {spec.width}x{spec.height}px
            </span>
          </div>
          <h2 className="text-base font-semibold text-white">{spec.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={spec.canvaTemplateSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
          >
            <Search size={13} />
            <span>Matching Templates</span>
          </a>

          <a
            href={spec.canvaLaunchUrl || "https://www.canva.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] text-white text-xs font-semibold hover:opacity-95 transition-all shadow-[0_4px_20px_rgba(0,196,204,0.3)] active:scale-95 flex-shrink-0"
          >
            <Palette size={14} />
            <span>Open in Canva</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Visual Mock Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Design Layout Card */}
        <div
          className="lg:col-span-7 rounded-2xl border border-zinc-800 p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px]"
          style={{ backgroundColor: spec.palette?.background || "#09090b" }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-25 pointer-events-none rounded-full blur-3xl"
            style={{ backgroundColor: spec.palette?.primary || "#00C4CC" }}
          />

          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
              {spec.category}
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: spec.palette?.primary || "#00C4CC" }}
            />
          </div>

          <div className="relative z-10 space-y-3 my-auto py-4">
            <h1
              className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight"
              style={{
                color: spec.palette?.text || "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {spec.content?.headline || spec.title}
            </h1>
            {spec.content?.subheadline && (
              <p className="text-sm md:text-base text-zinc-300 font-normal leading-relaxed">
                {spec.content.subheadline}
              </p>
            )}
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
            <span
              className="px-4 py-1.5 rounded-full text-xs font-bold shadow"
              style={{
                backgroundColor: spec.palette?.primary || "#00C4CC",
                color: "#000000",
              }}
            >
              {spec.content?.callToAction || "Explore Design"}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              {spec.width} × {spec.height} PX
            </span>
          </div>
        </div>

        {/* Right: Design Specs & Color Palette */}
        <div className="lg:col-span-5 space-y-4">
          {/* Color Palette */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Color Palette</span>
              <span className="text-[10px] text-zinc-500 font-mono">Click hex to copy</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {spec.palette &&
                Object.entries(spec.palette)
                  .filter(([k]) => !["cardBg", "mutedText"].includes(k))
                  .map(([key, hex]: any) => (
                    <button
                      key={key}
                      onClick={() => copyHex(hex)}
                      className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 flex items-center gap-2.5 text-left transition-colors group"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase text-zinc-500 capitalize">{key}</p>
                        <p className="text-xs font-mono text-zinc-200 truncate group-hover:text-white">
                          {copiedColor === hex ? "✓ Copied" : hex}
                        </p>
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          {/* Typography & Assets */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Typography & Assets</span>
              <button
                onClick={copyAllCopy}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedCopy ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedCopy ? "Copied" : "Copy Copywriting"}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block">Heading Font</span>
                <span className="text-zinc-200 font-medium">
                  {spec.typography?.headingFont || "Plus Jakarta Sans"}
                </span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block">Body Font</span>
                <span className="text-zinc-200 font-medium">
                  {spec.typography?.bodyFont || "Inter / Roboto"}
                </span>
              </div>
            </div>

            {spec.visualElements && spec.visualElements.length > 0 && (
              <div className="pt-2 border-t border-zinc-900 text-[11px] text-zinc-400 space-y-1">
                <span className="text-zinc-500 font-medium block">Visual Composition Elements:</span>
                {spec.visualElements.map((el: string, idx: number) => (
                  <p key={idx} className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-1 h-1 rounded-full bg-violet-400" />
                    <span>{el}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
