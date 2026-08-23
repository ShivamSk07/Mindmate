"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Code2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import mermaid from "mermaid";

// ─── Renderer Init ───────────────────────────────────────────────────────────
let isRendererInitialized = false;
function initRenderer() {
  if (typeof window === "undefined" || isRendererInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Inter, sans-serif",
    themeVariables: {
      darkMode: true,
      background: "#111113",
      primaryColor: "#1c1c1e",
      primaryTextColor: "#f2f2f7",
      primaryBorderColor: "#3a3a3c",
      lineColor: "#636366",
      secondaryColor: "#1c1c1e",
      tertiaryColor: "#111113",
      edgeLabelBackground: "#1c1c1e",
      nodeBorder: "#3a3a3c",
      mainBkg: "#1c1c1e",
      clusterBkg: "#111113",
      clusterBorder: "#2c2c2e",
      titleColor: "#f2f2f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    },
  });
  isRendererInitialized = true;
}

// ─── Sanitizer ───────────────────────────────────────────────────────────────
export function cleanMermaidCode(rawCode: string): string {
  if (!rawCode) return "";
  let clean = rawCode.trim();

  // Strip markdown code fences
  clean = clean.replace(/^```[a-zA-Z0-9_-]*\n?/i, "").replace(/\n?```$/i, "").trim();

  // Remove HTML tags that break diagram parser
  clean = clean.replace(/<br\s*\/?>/gi, " ");
  clean = clean.replace(/<[^>]+>/g, "");

  // Normalize unicode dashes, smart quotes, non-breaking spaces
  clean = clean
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ");

  // Fix arrow typos
  clean = clean.replace(/--\s+>/g, "-->").replace(/==\s+>/g, "==>").replace(/\.-\s+>/g, ".->");

  // Fix pipe labels
  clean = clean.replace(/\|([^|\n\r]+)\|/g, (_, label) =>
    `|${label.replace(/"/g, "'").replace(/<[^>]+>/g, "")}|`
  );

  // Auto-detect graph header (stripping comments first)
  const strippedComments = clean.replace(/^%%[^\n]*\n?/gm, "").trim();
  const hasHeader =
    /^(flowchart|graph|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|pie|gitGraph|journey|timeline|mindmap|quadrantChart|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/im.test(strippedComments);
  if (!hasHeader) clean = `flowchart TD\n  ${clean}`;

  return clean;
}

// ─── Helper to detect if code block is a diagram ─────────────────────────────
export function isDiagramCode(className?: string, rawCode?: string): boolean {
  if (!rawCode) return false;
  if (className && /language-(mermaid|diagram|flowchart|sequence|gantt|classDiagram)/i.test(className)) {
    return true;
  }
  const clean = rawCode.trim().replace(/^```[a-zA-Z0-9_-]*\n?/i, "").replace(/\n?```$/i, "").replace(/^%%[^\n]*\n?/gm, "").trim();
  return /^(flowchart|graph|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|pie|gitGraph|journey|timeline|mindmap|quadrantChart|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i.test(clean);
}

// ─── Fallback render URLs (internal, not exposed to user) ────────────────────
export function getMermaidInkUrls(diagramCode: string): { svgUrl: string; pngUrl: string } {
  try {
    const clean = cleanMermaidCode(diagramCode);
    const obj = { code: clean, mermaid: { theme: "dark" } };
    const b64 =
      typeof window !== "undefined"
        ? btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
        : Buffer.from(JSON.stringify(obj)).toString("base64");
    return { svgUrl: `https://mermaid.ink/svg/${b64}`, pngUrl: `https://mermaid.ink/img/${b64}` };
  } catch {
    return { svgUrl: "", pngUrl: "" };
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MermaidViewerProps {
  code: string;
  title?: string;
  className?: string;
  enableFullscreen?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MermaidViewer({
  code,
  title = "Visual Diagram",
  className = "",
  enableFullscreen = true,
}: MermaidViewerProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"diagram" | "source">("diagram");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom + Pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const uniqueIdRef = useRef(`clarity_diagram_${Math.random().toString(36).slice(2, 9)}`);

  const cleanCode = cleanMermaidCode(code);
  const fallbackUrls = getMermaidInkUrls(cleanCode);

  // ── Render ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    initRenderer();
    setLoading(true);
    setError(null);
    setSvgContent(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });

    (async () => {
      try {
        const { svg } = await mermaid.render(uniqueIdRef.current, cleanCode);
        if (isMounted) { setSvgContent(svg); setLoading(false); }
      } catch (e: any) {
        if (fallbackUrls.svgUrl) {
          try {
            const res = await fetch(fallbackUrls.svgUrl);
            if (res.ok) {
              const svg = await res.text();
              if (isMounted && svg.includes("<svg")) {
                setSvgContent(svg); setLoading(false); return;
              }
            }
          } catch {}
        }
        if (isMounted) {
          const msg = (e?.message || "").replace(/Parse error on line \d+:\s*/g, "");
          setError(msg.length > 140 ? msg.slice(0, 140) + "…" : msg || "Could not render diagram");
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      document.getElementById(`d${uniqueIdRef.current}`)?.remove();
    };
  }, [cleanCode]);

  // ── Pan handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode !== "diagram" || !svgContent) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  }, [viewMode, svgContent, offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: offsetStartRef.current.x + (e.clientX - dragStartRef.current.x),
      y: offsetStartRef.current.y + (e.clientY - dragStartRef.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (viewMode !== "diagram" || !svgContent) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((p) => Math.min(3, Math.max(0.25, p + delta)));
  }, [viewMode, svgContent]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const zoomIn = () => setScale((p) => Math.min(3, p + 0.15));
  const zoomOut = () => setScale((p) => Math.max(0.25, p - 0.15));
  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `clarity-diagram-${Date.now()}.svg`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else if (fallbackUrls.svgUrl) {
      window.open(fallbackUrls.svgUrl, "_blank");
    }
  };

  const handleDownloadPng = () => {
    if (fallbackUrls.pngUrl) window.open(fallbackUrls.pngUrl, "_blank");
  };

  const dragCursor = viewMode === "diagram" && svgContent
    ? (isDragging ? "cursor-grabbing" : "cursor-grab")
    : "";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`my-3 flex flex-col rounded-[14px] overflow-hidden border border-[#2c2c2e] select-none
        ${isFullscreen
          ? "fixed inset-3 z-[9999] bg-[#111113]"
          : `bg-[#111113] ${className}`
        }`}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#222226] shrink-0 bg-[#111113]">

        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[#8e8e93]" />
          <span className="text-[12px] font-medium text-[#8e8e93] tracking-tight">{title}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">

          {/* View Toggle */}
          <div className="flex items-center bg-[#1c1c1e] rounded-[8px] p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode("diagram")}
              title="Diagram"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-all duration-100
                ${viewMode === "diagram"
                  ? "bg-[#2c2c2e] text-[#f2f2f7]"
                  : "text-[#636366] hover:text-[#8e8e93]"
                }`}
            >
              <Eye size={10} />
              <span>Diagram</span>
            </button>
            <button
              onClick={() => setViewMode("source")}
              title="Source"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-medium transition-all duration-100
                ${viewMode === "source"
                  ? "bg-[#2c2c2e] text-[#f2f2f7]"
                  : "text-[#636366] hover:text-[#8e8e93]"
                }`}
            >
              <Code2 size={10} />
              <span>Code</span>
            </button>
          </div>

          {/* Zoom — only when diagram rendered */}
          {viewMode === "diagram" && svgContent && (
            <div className="flex items-center bg-[#1c1c1e] rounded-[8px] p-0.5 gap-0.5">
              <button
                onClick={zoomOut}
                title="Zoom out"
                className="p-1 rounded-[6px] text-[#636366] hover:text-[#f2f2f7] hover:bg-[#2c2c2e] transition-all"
              >
                <ZoomOut size={11} />
              </button>
              <button
                onClick={resetView}
                title="Reset view"
                className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono text-[#636366] hover:text-[#f2f2f7] hover:bg-[#2c2c2e] transition-all min-w-[34px] text-center"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                title="Zoom in"
                className="p-1 rounded-[6px] text-[#636366] hover:text-[#f2f2f7] hover:bg-[#2c2c2e] transition-all"
              >
                <ZoomIn size={11} />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-3.5 bg-[#2c2c2e] mx-0.5" />

          {/* Downloads */}
          {svgContent && viewMode === "diagram" && (
            <>
              <button
                onClick={handleDownloadSvg}
                title="Download SVG"
                className="flex items-center gap-1 px-2 py-1 rounded-[8px] text-[11px] font-medium text-[#636366] hover:text-[#f2f2f7] hover:bg-[#1c1c1e] transition-all"
              >
                <Download size={10} />
                <span>SVG</span>
              </button>
              <button
                onClick={handleDownloadPng}
                title="Download PNG"
                className="flex items-center gap-1 px-2 py-1 rounded-[8px] text-[11px] font-medium text-[#636366] hover:text-[#f2f2f7] hover:bg-[#1c1c1e] transition-all"
              >
                <Download size={10} />
                <span>PNG</span>
              </button>
              <div className="w-px h-3.5 bg-[#2c2c2e] mx-0.5" />
            </>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            title="Copy source"
            className={`flex items-center gap-1 px-2 py-1 rounded-[8px] text-[11px] font-medium transition-all
              ${copied ? "text-[#30d158]" : "text-[#636366] hover:text-[#f2f2f7] hover:bg-[#1c1c1e]"}`}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Fullscreen */}
          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="p-1 rounded-[8px] text-[#636366] hover:text-[#f2f2f7] hover:bg-[#1c1c1e] transition-all"
            >
              {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div
        ref={canvasRef}
        className={`relative overflow-hidden bg-[#0a0a0b] flex-1 ${dragCursor}
          ${isFullscreen ? "min-h-0" : "min-h-[220px] max-h-[500px]"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ userSelect: "none" }}
      >
        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin text-[#636366]" />
            <span className="text-[11px] text-[#636366]">Rendering…</span>
          </div>
        )}

        {/* Source view */}
        {!loading && viewMode === "source" && (
          <div className="absolute inset-0 overflow-auto p-4">
            <pre
              className="text-[12px] font-mono text-[#8e8e93] leading-relaxed whitespace-pre bg-transparent"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}
            >
              {cleanCode}
            </pre>
          </div>
        )}

        {/* Error state */}
        {!loading && viewMode === "diagram" && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <span className="text-[12px] font-medium text-[#8e8e93]">Could not render diagram</span>
            <p className="text-[11px] text-[#636366] max-w-sm text-center leading-relaxed">{error}</p>
            <button
              onClick={() => setViewMode("source")}
              className="text-[11px] px-3 py-1 rounded-[8px] bg-[#1c1c1e] border border-[#2c2c2e] text-[#8e8e93] hover:text-[#f2f2f7] transition-all"
            >
              View source
            </button>
          </div>
        )}

        {/* Diagram */}
        {!loading && viewMode === "diagram" && !error && svgContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.06s ease-out",
                pointerEvents: "none",
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {viewMode === "diagram" && svgContent && !loading && (
        <div className="flex items-center justify-between px-3 py-1 border-t border-[#222226] shrink-0 bg-[#111113]">
          <span className="text-[10px] text-[#3a3a3c]">Scroll to zoom · Drag to pan</span>
          <button
            onClick={resetView}
            className="flex items-center gap-1 text-[10px] text-[#3a3a3c] hover:text-[#636366] transition-colors"
          >
            <RotateCcw size={9} />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MermaidViewer;
