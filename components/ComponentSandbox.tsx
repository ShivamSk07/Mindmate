"use client";

import React, { useState, useMemo } from "react";
import { Play, Code, Eye, RefreshCw, ExternalLink, Copy, Check, Maximize2, Minimize2, Smartphone, Monitor, Tablet } from "lucide-react";

interface ComponentSandboxProps {
  code: string;
  title?: string;
  className?: string;
}

export function extractCodeBlock(content: string): { code: string; language: string; isPreviewable: boolean } {
  if (!content) return { code: "", language: "", isPreviewable: false };

  // Check for markdown code fences like ```html or ```tsx or ```jsx
  const match = content.match(/```(html|jsx|tsx|javascript|js|react)?\s*([\s\S]*?)```/i);
  if (match) {
    const lang = (match[1] || "").toLowerCase();
    const raw = match[2].trim();
    const isHtmlOrJsx =
      lang === "html" ||
      lang === "jsx" ||
      lang === "tsx" ||
      /<(!DOCTYPE|html|div|button|section|main|nav|header|footer|form|card)/i.test(raw) ||
      raw.includes("export default function") ||
      raw.includes("return (");
    return { code: raw, language: lang || "html", isPreviewable: isHtmlOrJsx };
  }

  // Check if content itself is pure HTML or JSX
  const trimmed = content.trim();
  const isHtml =
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<section") ||
    /<[a-z][\s\S]*>/i.test(trimmed);

  return {
    code: trimmed,
    language: isHtml ? "html" : "text",
    isPreviewable: isHtml,
  };
}

export default function ComponentSandbox({ code, title = "Interactive Preview", className = "" }: ComponentSandboxProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const parsed = useMemo(() => extractCodeBlock(code), [code]);

  // Generate an HTML document bundle with Tailwind CSS and modern styling
  const bundledHtml = useMemo(() => {
    const rawCode = parsed.code || code;

    // Check if it's already a full HTML document
    if (/<html[\s\S]*<\/html>/i.test(rawCode)) {
      return rawCode;
    }

    // Convert React JSX export into a simple renderable HTML/JS script if needed
    let innerContent = rawCode;
    const isReactComponent =
      rawCode.includes("export default function") ||
      rawCode.includes("function App()") ||
      rawCode.includes("const App =") ||
      rawCode.includes("return (");

    if (isReactComponent) {
      return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 500: '#6366f1', 600: '#4f46e5' }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 1.5rem; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${rawCode.replace(/export\s+default\s+function\s*([a-zA-Z0-9_]*)/, "function App")}
    const rootElement = document.getElementById('root');
    ReactDOM.createRoot(rootElement).render(<App />);
  </script>
</body>
</html>`;
    }

    // Standard HTML + Tailwind markup
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 1.5rem;
      min-height: 100vh;
      box-sizing: border-box;
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 antialiased flex flex-col justify-start items-stretch">
  ${innerContent}
</body>
</html>`;
  }, [parsed.code, code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(parsed.code || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deviceWidthClass =
    device === "mobile" ? "max-w-[390px]" : device === "tablet" ? "max-w-[768px]" : "w-full";

  return (
    <div className={`flex flex-col h-full bg-[#070709] border border-white/10 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Sandbox Navigation Toolbar */}
      <div className="h-11 px-3 bg-[#0d0d12] border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye size={12} className={activeTab === "preview" ? "text-violet-400" : ""} />
              <span>Live UI Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "bg-zinc-800 text-zinc-100 border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code size={12} />
              <span>Source Code</span>
            </button>
          </div>

          <span className="text-zinc-700 mx-1">|</span>
          <span className="text-xs font-semibold text-zinc-300 truncate max-w-[200px]">
            {title}
          </span>
        </div>

        {/* Viewport controls (Only in preview mode) */}
        <div className="flex items-center gap-2">
          {activeTab === "preview" && (
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setDevice("desktop")}
                title="Desktop viewport (Full)"
                className={`p-1 rounded ${device === "desktop" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Monitor size={13} />
              </button>
              <button
                onClick={() => setDevice("tablet")}
                title="Tablet viewport (768px)"
                className={`p-1 rounded ${device === "tablet" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Tablet size={13} />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                title="Mobile viewport (390px)"
                className={`p-1 rounded ${device === "mobile" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Smartphone size={13} />
              </button>
            </div>
          )}

          {activeTab === "preview" && (
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Reload sandbox preview"
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Frame */}
      <div className="flex-1 min-h-0 bg-[#050508] relative flex justify-center items-stretch overflow-hidden">
        {activeTab === "preview" ? (
          <div className={`w-full h-full flex justify-center items-stretch p-3 transition-all`}>
            <div className={`w-full h-full ${deviceWidthClass} transition-all duration-300 flex flex-col rounded-lg overflow-hidden border border-white/10 bg-[#09090d] shadow-2xl relative`}>
              <iframe
                key={refreshKey}
                title="Sandbox Component Preview"
                srcDoc={bundledHtml}
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full h-full border-0 bg-transparent flex-1"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs text-zinc-300 bg-[#08080c] select-text">
            <pre className="whitespace-pre-wrap leading-relaxed">{parsed.code || code}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
