"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Github,
  Triangle,
  Plug,
  Globe,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink,
  Laptop,
  Terminal,
  Monitor,
  GitBranch,
  GitPullRequest,
  Workflow,
  Sparkles,
  Layers,
  Code2,
  Brain,
  ShieldCheck,
  Kanban,
  FileCode2,
  Play,
  RotateCw,
  FolderLock,
  SlidersHorizontal,
} from "lucide-react";

export default function AppleOpenAILandingPage() {
  const [selectedOS, setSelectedOS] = useState<"windows" | "mac" | "linux">("windows");
  const [activeTab, setActiveTab] = useState<"cowork" | "response" | "thought">("cowork");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("mac")) {
        setSelectedOS("mac");
      } else if (ua.includes("linux")) {
        setSelectedOS("linux");
      } else {
        setSelectedOS("windows");
      }
    }
  }, []);

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#000000] text-[#ededed] selection:bg-zinc-800 selection:text-white font-sans antialiased scroll-smooth">
      {/* ═════════════════════ APEX NAVIGATION ═════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#000000]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-white/30 transition-colors">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-base tracking-tight text-white">Clarity</span>
              <span className="text-[11px] font-medium text-zinc-400">in devs</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] text-zinc-400 font-medium">
            <a href="#cowork" className="hover:text-white transition-colors">
              Cowork
            </a>
            <a href="#response" className="hover:text-white transition-colors">
              Response
            </a>
            <a href="#thought" className="hover:text-white transition-colors">
              Thought
            </a>
            <a href="#downloads" className="hover:text-white transition-colors">
              Downloads
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/chat"
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════ HERO: APPLE / OPENAI STYLE ═════════════════════ */}
      <section className="pt-24 pb-20 md:pt-36 md:pb-28 px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Eyebrow Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-xs font-medium text-zinc-300 mb-8 tracking-wide">
            <span className="text-zinc-400">Vision</span>
            <span className="text-zinc-600">•</span>
            <span className="text-white font-semibold">Clarity in devs (developers)</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight text-white leading-[1.05] mb-8">
            Pure thought. <br />
            <span className="text-zinc-400">Pure clarity in response.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed mb-12">
            The autonomous AI cowork workspace engineered for developers. No noise, no hallucinated clutter — just
            structured first-principles reasoning and agentic execution.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
            <a
              href="/api/download?type=installer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-medium text-sm flex items-center justify-center gap-2.5 shadow-sm hover:bg-zinc-200 transition-all"
            >
              <Download className="w-4 h-4 text-zinc-950" />
              <span>Download Clarity for Windows (.exe)</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono">180 MB</span>
            </a>

            <Link
              href="/chat"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/[0.1] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Try in Browser</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>

          {/* Minimalist OS Switcher Hint */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
            <span>Also available on</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
              macOS (.dmg)
            </a>
            <span>•</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
              Linux (.AppImage)
            </a>
            <span>•</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
              Portable Windows
            </a>
          </div>
        </div>

        {/* ═════════════════════ CLEAN MINIMALIST PRODUCT SHOWCASE ═════════════════════ */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="rounded-2xl border border-white/[0.12] bg-[#0c0c0e] shadow-2xl overflow-hidden text-left">
            {/* Titlebar */}
            <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#121215] text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="ml-3 font-medium text-zinc-300">Clarity // Workspace</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cowork Agent Ready
                </span>
                <span className="text-zinc-600">|</span>
                <span>GitHub & MCP Synced</span>
              </div>
            </div>

            {/* Split Screen UI: Cowork Left & Response Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Left Pane: Agentic Plan & Integrations */}
              <div className="md:col-span-5 border-r border-white/[0.08] bg-[#0f0f12] p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Connected Workflows
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">Autonomous</span>
                  </div>

                  {/* Integration Pills */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center gap-2 text-zinc-200">
                      <Github className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[11px]">GitHub</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center gap-2 text-zinc-200">
                      <Triangle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[11px]">Vercel</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center gap-2 text-zinc-200">
                      <Plug className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[11px]">MCP</span>
                    </div>
                  </div>
                </div>

                {/* Plan Execution Sequence */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Execution Plan
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-zinc-900/90 border border-white/[0.06] flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-white block">1. Clone & inspect codebase schema</span>
                        <span className="text-zinc-500 text-[11px]">Parsed Prisma schema & route handlers</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/90 border border-white/[0.06] flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-white block">2. Decompose logic & synthesize architecture</span>
                        <span className="text-zinc-500 text-[11px]">Zero-overhead clean refactor</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/90 border border-emerald-500/30 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5 animate-pulse" />
                      <div>
                        <span className="font-medium text-emerald-400 block">3. Code diff & live artifact generated</span>
                        <span className="text-zinc-400 text-[11px]">Waiting for one-click approval</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: High-Signal Code & Mermaid Output */}
              <div className="md:col-span-7 p-6 md:p-8 bg-[#09090b] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
                    <span className="text-zinc-400 font-medium">Clarity Synthesizer</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Clean Architecture Output</span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    Here is the refactored agentic pipeline with human-in-the-loop approvals and automated PR generation:
                  </p>

                  {/* Code Diff Mockup */}
                  <div className="rounded-xl bg-[#121215] border border-white/[0.08] p-4 text-xs font-mono space-y-1 overflow-hidden">
                    <div className="text-zinc-500 pb-2 mb-1 border-b border-white/[0.04] text-[10px]">
                      // src/agent/pipeline.ts
                    </div>
                    <div className="text-emerald-400">+ export async function executePlan(task: CoworkTask) &#123;</div>
                    <div className="text-emerald-400">+ const approval = await requireUserApproval(task);</div>
                    <div className="text-emerald-400">+ if (approval.granted) return task.deployToVercel();</div>
                    <div className="text-zinc-400">&#125;</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121215] border border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                  <span>Artifacts: Mermaid Diagram + Git Branch</span>
                  <button className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors">
                    Approve & Merge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ PILLAR 1: CLARITY COWORK ═════════════════════ */}
      <section id="cowork" className="py-24 px-6 border-t border-white/[0.08] bg-[#050507]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
              Autonomous Cowork Mode
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
              Your AI Coworker for Real Engineering.
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
              Clarity doesn't just chat. It acts as an autonomous pair programmer and collaborator that integrates with
              your GitHub repositories, Vercel deployments, and MCP tool ecosystems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0d0d10] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">GitHub & Vercel Automation</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Connect your repositories to autonomously inspect codebases, execute refactors, generate pull
                requests, and trigger preview deployments.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0d0d10] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                <Plug className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Model Context Protocol (MCP)</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Extend Clarity with your own MCP servers and browser agents. Give your AI teammate direct access to your
                APIs, local databases, and custom CLI tools.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-white/[0.08] bg-[#0d0d10] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Human-in-the-Loop Approvals</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                You maintain total authority. Whenever Clarity needs to write files, push branches, or run critical
                scripts, it stops and prompts for your approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ PILLAR 2: CLARITY IN RESPONSE ═════════════════════ */}
      <section id="response" className="py-24 px-6 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Deterministic Precision
              </span>
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Clarity in Response. <br />
                Zero Fluff.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Traditional AI chat models bury the real solution under conversational filler. Clarity is tuned for
                high-density, actionable output: clean syntax-highlighted code, LaTeX equations, and architectural
                diagrams.
              </p>
              <div className="space-y-3 pt-2 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Mermaid.js sequence diagrams & interactive flowcharts</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Document synthesis from multi-page PDFs, TXT & codebases</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Interactive Kanban boards generated straight from chat discussions</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 p-7 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs text-zinc-400 font-mono">
                <span>Architecture Diagram</span>
                <span className="text-emerald-400">Mermaid Rendered</span>
              </div>
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.04] text-xs font-mono text-zinc-300 leading-relaxed">
                <span className="text-zinc-500 block mb-2">// System Sequence Flow</span>
                <div className="space-y-1">
                  <div>User &rarr; Clarity: Request Complex Task</div>
                  <div className="text-emerald-400">Clarity &rarr; MCP: Query Local Schema &amp; DB</div>
                  <div className="text-zinc-400">MCP &rarr; Clarity: Return Exact Context</div>
                  <div className="text-blue-400">Clarity &rarr; User: Output Verified Plan</div>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Every technical response is verified against active project context to eliminate hallucinations before
                they reach your terminal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ PILLAR 3: CLARITY IN THOUGHT ═════════════════════ */}
      <section id="thought" className="py-24 px-6 border-t border-white/[0.08] bg-[#050507]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 order-2 md:order-1 p-7 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs text-zinc-400">
                <span className="font-semibold text-white">Memory Vault & Privacy</span>
                <span className="text-zinc-500 font-mono">Client-Side SHA-512</span>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Brain className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cross-Chat Memory Vault</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Remembers your project structure, coding standards, and directives across all future sessions.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN-Locked Confidential Vault</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Client-side 4-digit PIN lock encryption for private chats and sensitive project files.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 order-1 md:order-2 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Cognitive Foundation
              </span>
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Clarity in Thought. <br />
                First-Principles Logic.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                True clarity starts before generating a single character. Clarity deconstructs questions into core
                axioms, isolates project constraints, and builds reasoning step-by-step so you understand exactly how
                conclusions were reached.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ APPLE-STYLE DOWNLOAD DOCK (NO EDTECH PRICING) ═════════════════════ */}
      <section id="downloads" className="py-24 px-6 border-t border-white/[0.08] text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
              Native Downloads
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
              Get Clarity for Your System.
            </h2>
            <p className="text-zinc-400 text-base max-w-lg mx-auto">
              Optimized desktop executables crafted for speed, offline recovery, and native window persistence.
            </p>
          </div>

          {/* Unified Apple-Style Download Deck */}
          <div className="p-8 rounded-3xl border border-white/[0.12] bg-[#0c0c0e] shadow-2xl text-left">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-bold">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Clarity for Windows</h3>
                  <p className="text-xs text-zinc-400">Windows 10 / 11 (64-bit) • v1.0.0 • 180 MB</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/api/download?type=installer"
                  className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Setup (.exe)</span>
                </a>
                <a
                  href="/api/download?type=portable"
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.1] text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <span>Portable (.exe)</span>
                </a>
              </div>
            </div>

            {/* Other Platforms in a Single Minimalist Row */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium text-white">macOS Universal</span>
                </div>
                <Link href="/chat" className="text-zinc-400 hover:text-white underline underline-offset-4">
                  .dmg
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium text-white">Linux Package</span>
                </div>
                <Link href="/chat" className="text-zinc-400 hover:text-white underline underline-offset-4">
                  .AppImage
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[#141418] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium text-white">Cloud Web App</span>
                </div>
                <Link href="/chat" className="text-zinc-400 hover:text-white underline underline-offset-4">
                  Instant Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ DEVELOPER & VISION STATEMENT ═════════════════════ */}
      <section className="py-24 px-6 border-t border-white/[0.08] bg-[#050507] text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
            Crafted for Builders
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            Clarity in devs. <br />
            Built by Shivam Kothekar.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
            "We built Clarity because modern AI tools were becoming too noisy, cluttered, and distracted. Our mission is
            simple: deliver pure clarity in thought, pure clarity in response, and empowering cowork capabilities to
            every developer."
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all shadow-sm"
            >
              Get Started for Free
            </Link>
            <a
              href="https://github.com/ShivamSk07/Mindmate"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.1] text-sm font-medium transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═════════════════════ FOOTER ═════════════════════ */}
      <footer className="py-12 px-6 border-t border-white/[0.08] bg-[#000000] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center p-0.5">
              <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-zinc-300">Clarity</span>
            <span>—</span>
            <span>Clarity in devs by <strong className="text-zinc-300 font-medium">Shivam Kothekar</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">
              Sign Up
            </Link>
          </div>

          <div className="text-zinc-600 font-mono">
            © {new Date().getFullYear()} Shivam Kothekar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
