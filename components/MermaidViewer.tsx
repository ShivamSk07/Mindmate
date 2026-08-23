"use client";

import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle
} from "lucide-react";
import mermaid from "mermaid";

// Initialize mermaid with custom dark theme configurations
let isMermaidInitialized = false;
function initMermaid() {
  if (typeof window === "undefined" || isMermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "inherit",
    themeVariables: {
      darkMode: true,
      background: "#09090b",
      primaryColor: "#1e1b4b",
      primaryTextColor: "#f4f4f5",
      primaryBorderColor: "#6366f1",
      lineColor: "#818cf8",
      secondaryColor: "#18181b",
      tertiaryColor: "#121215",
      edgeLabelBackground: "#18181b",
      nodeBorder: "#4f46e5",
      mainBkg: "#0f0f12",
      clusterBkg: "#131318",
      clusterBorder: "#27272a",
      titleColor: "#e0e7ff"
    }
  });
  isMermaidInitialized = true;
}

// Clean and sanitize Mermaid syntax
export function cleanMermaidCode(rawCode: string): string {
  if (!rawCode) return "";
  let clean = rawCode.trim();

  // Strip markdown code fences
  clean = clean.replace(/^```[a-zA-Z0-9_-]*\n?/i, "").replace(/\n?```$/i, "").trim();

  // Normalize unicode dashes, smart quotes, non-breaking spaces
  clean = clean
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ");

  // Fix common arrow typos: -- > to -->, == > to ==>
  clean = clean
    .replace(/--\s+>/g, "-->")
    .replace(/==\s+>/g, "==>")
    .replace(/\.-\s+>/g, "-.->");

  // Fix pipe labels with double quotes: |label "foo"| -> |label 'foo'|
  clean = clean.replace(/\|([^|\n\r]+)\|/g, (_, label) => {
    return `|${label.replace(/"/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;")}|`;
  });

  // Check if diagram has a header. If not, default to graph TD
  const hasHeader = /^(flowchart|graph|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|pie|gitGraph|journey|timeline|mindmap|quadrantChart|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/im.test(clean);
  if (!hasHeader) {
    clean = `graph TD\n  ${clean}`;
  }

  return clean;
}

// Generate fast, reliable fallback URLs (mermaid.ink)
export function getMermaidInkUrls(mermaidCode: string): { svgUrl: string; pngUrl: string } {
  try {
    const clean = cleanMermaidCode(mermaidCode);
    const obj = {
      code: clean,
      mermaid: { theme: "dark" }
    };
    const b64 = typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      : Buffer.from(JSON.stringify(obj)).toString("base64");

    return {
      svgUrl: `https://mermaid.ink/svg/${b64}`,
      pngUrl: `https://mermaid.ink/img/${b64}`
    };
  } catch {
    return { svgUrl: "", pngUrl: "" };
  }
}

interface MermaidViewerProps {
  code: string;
  title?: string;
  className?: string;
  enableFullscreen?: boolean;
}

export function MermaidViewer({
  code,
  title = "Live Visual Diagram",
  className = "",
  enableFullscreen = true
}: MermaidViewerProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"diagram" | "source">("diagram");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueIdRef = useRef(`mermaid_${Math.random().toString(36).slice(2, 9)}`);

  const cleanCode = cleanMermaidCode(code);
  const fallbackUrls = getMermaidInkUrls(cleanCode);

  useEffect(() => {
    let isMounted = true;
    initMermaid();

    async function renderDiagram() {
      setLoading(true);
      setError(null);

      try {
        const id = uniqueIdRef.current;
        // Attempt native client-side rendering
        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setLoading(false);
        }
      } catch (clientErr: any) {
        console.warn("[MermaidViewer] Client render issue, trying fallback service:", clientErr);
        // Attempt fallback fetch from mermaid.ink
        if (fallbackUrls.svgUrl) {
          try {
            const res = await fetch(fallbackUrls.svgUrl);
            if (res.ok) {
              const fallbackSvg = await res.text();
              if (isMounted && fallbackSvg.includes("<svg")) {
                setSvgContent(fallbackSvg);
                setError(null);
                setLoading(false);
                return;
              }
            }
          } catch (fetchErr) {
            console.error("[MermaidViewer] Fallback fetch failed:", fetchErr);
          }
        }

        if (isMounted) {
          setError(clientErr?.message || "Diagram syntax could not be rendered");
          setLoading(false);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
      // Clean up any stray error elements created by mermaid
      const stray = document.getElementById(`d${uniqueIdRef.current}`);
      if (stray) stray.remove();
    };
  }, [cleanCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (svgContent) {
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagram-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (fallbackUrls.svgUrl) {
      window.open(fallbackUrls.svgUrl, "_blank");
    }
  };

  const handleDownloadPng = () => {
    if (fallbackUrls.pngUrl) {
      window.open(fallbackUrls.pngUrl, "_blank");
    } else if (svgContent) {
      // Create canvas and export PNG
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width || 1200;
        canvas.height = image.height || 800;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#09090b";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          const png = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.download = `diagram-${Date.now()}.png`;
          a.href = png;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URLObj.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div
      className={`my-4 bg-[#0a0a0d] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen
          ? "fixed inset-4 z-50 flex flex-col bg-[#09090b]/98 backdrop-blur-xl border-zinc-700 shadow-2xl"
          : className
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121216] border-b border-[#27272a] select-none text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
            <Sparkles size={13} className="text-violet-400" />
            <span className="tracking-wide text-[11px] uppercase text-zinc-400">{title}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
            Mermaid SVG
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Toggle View */}
          <div className="flex items-center bg-[#18181e] border border-[#27272a] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("diagram")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "diagram"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="View Diagram"
            >
              <Eye size={11} />
              <span>Diagram</span>
            </button>
            <button
              onClick={() => setViewMode("source")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "source"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="View Mermaid Code"
            >
              <Code2 size={11} />
              <span>Code</span>
            </button>
          </div>

          {viewMode === "diagram" && svgContent && (
            <>
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-[#18181e] border border-[#27272a] rounded-lg p-0.5">
                <button
                  onClick={zoomOut}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut size={12} />
                </button>
                <button
                  onClick={resetZoom}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn size={12} />
                </button>
              </div>

              {/* Downloads */}
              <button
                onClick={handleDownloadSvg}
                className="flex items-center gap-1 px-2 py-1 bg-[#18181e] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
                title="Download SVG"
              >
                <Download size={11} />
                <span className="hidden sm:inline">SVG</span>
              </button>

              <button
                onClick={handleDownloadPng}
                className="flex items-center gap-1 px-2 py-1 bg-[#18181e] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
                title="Download PNG"
              >
                <Download size={11} />
                <span className="hidden sm:inline">PNG</span>
              </button>
            </>
          )}

          {/* Copy code button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 bg-[#18181e] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
            title="Copy Mermaid Source"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Fullscreen button */}
          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-[#18181e] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 hover:text-white rounded-lg text-[11px] transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={`w-full overflow-auto bg-[#070709] transition-all ${
          isFullscreen ? "flex-1 flex items-center justify-center p-6 min-h-0" : "p-4 min-h-[180px]"
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
            <Loader2 size={18} className="animate-spin text-violet-400" />
            <span className="text-xs">Rendering live diagram...</span>
          </div>
        ) : viewMode === "source" ? (
          <div className="w-full">
            <pre className="p-4 bg-[#0d0d11] border border-[#27272a] rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">
              {cleanCode}
            </pre>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
              <AlertTriangle size={15} />
              <span>Diagram Rendering Notice</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md mb-4">
              {error}
            </p>
            <pre className="p-3 bg-[#111115] border border-[#27272a] rounded-lg text-[11px] font-mono text-zinc-300 text-left max-w-full overflow-x-auto">
              {cleanCode}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            className="flex items-center justify-center w-full min-h-[160px] overflow-auto transition-transform"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center"
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="flex items-center justify-center py-8 text-xs text-zinc-500">
            No diagram output
          </div>
        )}
      </div>
    </div>
  );
}

export default MermaidViewer;
