"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Sparkles,
  Zap,
  Shield,
  Monitor,
  Terminal,
  Cpu,
  Layers,
  Globe,
  ArrowRight,
  Check,
  Lock,
  ChevronRight,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Share2,
  FolderLock,
  Kanban,
  Sparkle,
  Radio,
  FileCode2,
  Bell,
  WifiOff,
} from "lucide-react";

export default function LandingPage() {
  const [userOS, setUserOS] = useState<"windows" | "mac" | "linux">("windows");
  const [copiedShortcut, setCopiedShortcut] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) {
        setUserOS("mac");
      } else if (ua.includes("linux")) {
        setUserOS("linux");
      } else {
        setUserOS("windows");
      }
    }
  }, []);

  const copyQuickProtocol = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText("clarity://open");
      setCopiedShortcut(true);
      setTimeout(() => setCopiedShortcut(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-zinc-800 selection:text-white font-sans antialiased relative overflow-x-hidden overflow-y-auto">
      {/* Ambient Gradient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[600px] right-[-100px] w-[500px] h-[500px] bg-zinc-800/10 blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-[-100px] w-[600px] h-[600px] bg-zinc-800/10 blur-[180px] pointer-events-none -z-10" />

      {/* ═════════════════════ NAVBAR ═════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center p-1 shadow-inner group-hover:border-zinc-500 transition-colors">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white">Clarity</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                v1.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#downloads" className="hover:text-white transition-colors">
              Downloads
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#specs" className="hover:text-white transition-colors">
              Specs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white px-3.5 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/chat"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm hover:shadow-white/10"
            >
              <span>Open Web App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════ HERO SECTION ═════════════════════ */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-zinc-200">Clarity Desktop & Cloud v1.0.0 is Live</span>
            <span className="text-zinc-600">|</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white flex items-center gap-0.5">
              Get Executable <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
            The Autonomous AI Workspace for{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              High-Speed Reasoning.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed mb-10">
            Unify multi-model intelligence, persistent memory vaults, visual artifacts, and native desktop power in
            one distraction-free dark workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6">
            {userOS === "windows" ? (
              <a
                href="#downloads"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-white/10 hover:bg-zinc-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Monitor className="w-4 h-4 text-zinc-950" />
                <span>Download for Windows (x64)</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                  .exe
                </span>
              </a>
            ) : userOS === "mac" ? (
              <a
                href="#downloads"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-white/10 hover:bg-zinc-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Laptop className="w-4 h-4 text-zinc-950" />
                <span>Download for macOS (Universal)</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                  .dmg
                </span>
              </a>
            ) : (
              <a
                href="#downloads"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-white/10 hover:bg-zinc-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Terminal className="w-4 h-4 text-zinc-950" />
                <span>Download for Linux</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                  .AppImage
                </span>
              </a>
            )}

            <Link
              href="/chat"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-800 font-medium text-sm flex items-center justify-center gap-2 transition-all hover:border-zinc-700"
            >
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>Launch Cloud Workspace</span>
            </Link>
          </div>

          {/* Quick Platform Bar */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
            <span>Also available for:</span>
            <a href="#downloads" className="hover:text-zinc-300 underline underline-offset-4">
              Windows Installer (.exe)
            </a>
            <span>•</span>
            <a href="#downloads" className="hover:text-zinc-300 underline underline-offset-4">
              Portable (.exe)
            </a>
            <span>•</span>
            <a href="#downloads" className="hover:text-zinc-300 underline underline-offset-4">
              macOS (.dmg)
            </a>
            <span>•</span>
            <a href="#downloads" className="hover:text-zinc-300 underline underline-offset-4">
              Linux (.deb)
            </a>
          </div>
        </div>

        {/* ═════════════════════ WORKSPACE SHOWCASE FRAME ═════════════════════ */}
        <div className="max-w-6xl mx-auto mt-16 md:mt-20">
          <div className="rounded-2xl border border-white/[0.08] bg-[#121214]/90 p-2 shadow-2xl backdrop-blur-2xl shadow-black/80 relative group">
            {/* Ambient Window Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700/20 via-zinc-500/10 to-zinc-700/20 rounded-2xl blur-xl opacity-40 group-hover:opacity-75 transition duration-1000 -z-10" />

            {/* Desktop App Frame Header */}
            <div className="h-10 px-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0c0c0e] rounded-t-xl text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-700/60 border border-white/5" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/60 border border-white/5" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/60 border border-white/5" />
                <span className="ml-3 font-mono text-[11px] text-zinc-500">Clarity Desktop — Production Workspace</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cerebras Llama 3.3 70B (840 t/s)
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">Memory Vault: Active</span>
              </div>
            </div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] bg-[#09090b] rounded-b-xl overflow-hidden">
              {/* Mini Sidebar */}
              <div className="hidden md:flex md:col-span-3 border-r border-white/[0.06] bg-[#0f0f12] p-4 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Conversations</span>
                    <span className="text-[10px] font-mono text-zinc-500">9 Active</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white flex items-center justify-between">
                      <span className="truncate">Autonomous Agent Workflow</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    <div className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                      <span className="truncate">Cerebras Low-Latency Benchmark</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                      <span className="truncate">Financial Synthesis & Charts</span>
                      <Lock className="w-3 h-3 text-amber-400/80" />
                    </div>
                    <div className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:bg-white/[0.03] transition-colors">
                      <span className="truncate">Database Migration Plan</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                      Tools & Canvases
                    </span>
                    <div className="space-y-1 text-xs text-zinc-400">
                      <div className="px-2.5 py-1.5 rounded hover:bg-white/[0.03] flex items-center gap-2">
                        <Kanban className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Interactive Kanban</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded hover:bg-white/[0.03] flex items-center gap-2">
                        <FolderLock className="w-3.5 h-3.5 text-amber-400" />
                        <span>PIN Protected Vault</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                      SK
                    </div>
                    <span>Shivam Kothekar</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">PRO</span>
                </div>
              </div>

              {/* Central Chat Stream */}
              <div className="md:col-span-9 p-6 flex flex-col justify-between bg-gradient-to-b from-[#09090b] to-[#0c0c0e]">
                <div className="space-y-5">
                  {/* User Query */}
                  <div className="flex justify-end">
                    <div className="max-w-xl rounded-2xl rounded-tr-sm bg-zinc-800/80 border border-zinc-700/50 px-4 py-3 text-sm text-zinc-100">
                      Synthesize our quarterly architecture goals into an execution roadmap with local offline failover.
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white p-1">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-200" />
                    </div>
                    <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-[#141417] border border-white/[0.06] p-5 text-sm text-zinc-300 space-y-3 shadow-md">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 pb-2 border-b border-white/[0.04]">
                        <span className="text-emerald-400">● Reasoning Synthesized (0.18s)</span>
                        <span>•</span>
                        <span>Multi-stage execution plan</span>
                      </div>
                      <p className="leading-relaxed">
                        Here is the optimized deployment matrix with native desktop resilience and low-latency fallbacks:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-zinc-400 block mb-0.5">Desktop Offline Guard</span>
                          <span className="text-emerald-400 font-semibold">Automatic Recovery</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-zinc-400 block mb-0.5">Response Throughput</span>
                          <span className="text-white font-semibold">840 Tokens / Second</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Input Box */}
                <div className="mt-8 pt-4">
                  <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3 flex items-center justify-between text-xs text-zinc-400 shadow-inner">
                    <span className="text-zinc-500">Ask Clarity anything or type '/' for personas & tools...</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Shift + Enter
                      </span>
                      <button className="w-7 h-7 rounded-lg bg-white text-zinc-950 flex items-center justify-center font-bold">
                        ↑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ BENTO GRID FEATURES ═════════════════════ */}
      <section id="features" className="py-24 px-6 border-t border-white/[0.06] bg-[#0c0c0e]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Engineered for Deep Synthesis & Maximum Velocity.
            </h2>
            <p className="text-zinc-400 text-base">
              Every detail is tailored to provide frictionless execution for researchers, developers, and thinkers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Fast Multi-Model Engine */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ultra-Fast Multi-Model Engine</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Switch instantly between Cerebras, Groq, DeepSeek reasoning architectures, and high-context models at
                  blistering 800+ tokens per second.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Inference Latency</span>
                <span className="text-emerald-400 font-bold">&lt; 0.20s TTFT</span>
              </div>
            </div>

            {/* Card 2: Memory Vault */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Persistent Memory Vault</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Clarity remembers your preferences, project structures, and custom persona directives across multiple
                  sessions without needing context re-prompts.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Context Recall</span>
                <span className="text-blue-400 font-bold">Encrypted Local + Cloud</span>
              </div>
            </div>

            {/* Card 3: Kanban & Canvas */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Visual Artifacts & Kanban</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Transform complex conversations into live Kanban task boards, Mermaid diagrams, interactive code
                  blocks, and exportable Markdown artifacts.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Artifact Output</span>
                <span className="text-purple-400 font-bold">PDF, Markdown & Mermaid</span>
              </div>
            </div>

            {/* Card 4: Pin-Locked Vaults */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">PIN-Locked Confidential Vaults</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Lock sensitive conversations and secret document syntheses with a custom client-side 4-digit PIN code
                  for complete peace of mind.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Privacy Guard</span>
                <span className="text-emerald-400 font-bold">Zero-Knowledge Pin Gate</span>
              </div>
            </div>

            {/* Card 5: Native Desktop Engine */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Monitor className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Native Windows Desktop App</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Equipped with offline auto-reconnect recovery, window bounds memory, JumpList taskbar actions, and
                  background response toast alerts.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Desktop Build</span>
                <span className="text-cyan-400 font-bold">NSIS & Portable (.exe)</span>
              </div>
            </div>

            {/* Card 6: Deep Research Synthesis */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Autonomous Web & PDF Synthesis</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Upload multi-page technical PDFs or trigger live web searches to synthesize complex research into
                  concise decision briefs instantly.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Document Engine</span>
                <span className="text-amber-400 font-bold">PDF, Word, TXT, Web</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ DOWNLOADS SECTION (ALL 3 OS) ═════════════════════ */}
      <section id="downloads" className="py-24 px-6 border-t border-white/[0.06] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
              Multi-Platform Availability
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Download Clarity for Your System.
            </h2>
            <p className="text-zinc-400 text-base">
              Native executables optimized for Windows 10/11, macOS, and Linux — plus zero-install cloud access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Windows Download Card */}
            <div className="rounded-2xl border-2 border-white/20 bg-[#121214] p-8 flex flex-col justify-between relative shadow-xl shadow-black/50">
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Featured Build
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 text-white">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Windows</h3>
                <p className="text-xs text-zinc-400 mb-6">Windows 10 / 11 (64-bit)</p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>One-click NSIS setup installer (~180MB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Standalone Portable .exe included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Taskbar JumpList & Toast Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Deep link protocol (clarity://)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <a
                  href="/api/download?type=installer"
                  className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Installer (.exe)</span>
                </a>
                <a
                  href="/api/download?type=portable"
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Download Portable (.exe)</span>
                </a>
              </div>
            </div>

            {/* macOS Download Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 text-white">
                  <Laptop className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">macOS</h3>
                <p className="text-xs text-zinc-400 mb-6">macOS 12 Monterey or later</p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Universal DMG (Apple Silicon & Intel)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Optimized M1/M2/M3/M4 performance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Retina display native crispness</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Offline fallback auto-reconnect</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href="/chat"
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download DMG (Universal)</span>
                </Link>
                <p className="text-[11px] text-center text-zinc-500 font-mono">Apple Silicon & Intel DMG</p>
              </div>
            </div>

            {/* Linux Download Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-8 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 text-white">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Linux</h3>
                <p className="text-xs text-zinc-400 mb-6">Ubuntu, Debian, Fedora, Arch</p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Standalone AppImage (Universal)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Debian package (.deb)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Lightweight memory footprint</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Dark titlebar & system tray</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href="/chat"
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download AppImage</span>
                </Link>
                <p className="text-[11px] text-center text-zinc-500 font-mono">Also available as .deb</p>
              </div>
            </div>
          </div>

          {/* Web Access Callout */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-zinc-900 via-[#121214] to-zinc-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white flex-shrink-0">
                <Globe className="w-6 h-6 text-zinc-300" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Prefer using Clarity in your browser?</h4>
                <p className="text-sm text-zinc-400">
                  Access all reasoning models, personas, and memory vaults instantly with zero installation.
                </p>
              </div>
            </div>
            <Link
              href="/chat"
              className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 whitespace-nowrap shadow-md"
            >
              <span>Launch Cloud App</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════ SYSTEM SPECS & PERFORMANCE ═════════════════════ */}
      <section id="specs" className="py-24 px-6 border-t border-white/[0.06] bg-[#0c0c0e]/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
              Architectural Benchmarks
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Built for Speed, Privacy & Precision.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-white/[0.06] bg-[#121214] text-center">
              <span className="text-3xl font-extrabold text-white font-mono block mb-1">0.18s</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Cold Start Response</span>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.06] bg-[#121214] text-center">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono block mb-1">840+</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Tokens / Sec Peak</span>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.06] bg-[#121214] text-center">
              <span className="text-3xl font-extrabold text-blue-400 font-mono block mb-1">100%</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Dark UI Consistency</span>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.06] bg-[#121214] text-center">
              <span className="text-3xl font-extrabold text-purple-400 font-mono block mb-1">0-Track</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Zero Data Logging</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ BOTTOM CTA ═════════════════════ */}
      <section className="py-24 px-6 border-t border-white/[0.06] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Step Into the Focused Intelligence Workspace.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto mb-10">
            Download Clarity for your desktop or launch in browser to experience ultra-fast reasoning workflows today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#downloads"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Get Clarity Desktop</span>
            </a>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-sm transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════ FOOTER ═════════════════════ */}
      <footer className="border-t border-white/[0.06] py-12 px-6 bg-[#070709] text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center p-0.5">
              <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-zinc-300">Clarity AI</span>
            <span>—</span>
            <span>Created by <strong className="text-zinc-300 font-medium">Shivam Kothekar</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">
              Sign Up
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">
              GitHub
            </a>
          </div>

          <div className="font-mono text-zinc-600">
            © {new Date().getFullYear()} Shivam Kothekar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
