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
  Kanban as KanbanIcon,
  Bot,
  Users2,
  Brain,
  MessageSquareCode,
  FileText,
  Sliders,
  Workflow,
  Sparkle,
} from "lucide-react";

export default function ProfessionalLandingPage() {
  const [userOS, setUserOS] = useState<"windows" | "mac" | "linux">("windows");

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

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#09090b] text-[#f4f4f5] selection:bg-zinc-800 selection:text-white font-sans antialiased scroll-smooth">
      {/* ═════════════════════ NAVBAR ═════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-zinc-700/60 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/img/logo.png" alt="Clarity Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white">Clarity</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                v1.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#thought" className="hover:text-white transition-colors">
              Thought Clarity
            </a>
            <a href="#cowork" className="hover:text-white transition-colors">
              Cowork Workspace
            </a>
            <a href="#downloads" className="hover:text-white transition-colors">
              Downloads
            </a>
            <a href="#developer" className="hover:text-white transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/chat"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════ HERO SECTION ═════════════════════ */}
      <section className="pt-20 pb-20 md:pt-28 md:pb-28 px-6 border-b border-zinc-800/60 bg-gradient-to-b from-[#09090b] via-[#0d0d10] to-[#09090b]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Clarity AI Workspace — Desktop & Web</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Clarity in Thought. <br />
            <span className="text-zinc-400">Clarity in Response.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed mb-10">
            A focused workspace built to eliminate AI noise. Experience structured reasoning, high-signal responses,
            and seamless cowork collaboration across desktop and web.
          </p>

          {/* Download CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-6">
            <a
              href="/api/download?type=installer"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-sm hover:bg-zinc-200 transition-all"
            >
              <Download className="w-4 h-4 text-zinc-950" />
              <span>Download for Windows (.exe)</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">180 MB</span>
            </a>

            <Link
              href="/chat"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4 text-zinc-400" />
              <span>Open in Web Browser</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Also available for:</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white underline underline-offset-4">
              macOS (.dmg)
            </a>
            <span>•</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white underline underline-offset-4">
              Linux (.AppImage)
            </a>
            <span>•</span>
            <a href="#downloads" className="text-zinc-400 hover:text-white underline underline-offset-4">
              Windows Portable
            </a>
          </div>
        </div>

        {/* ═════════════════════ CLEAN APP SHOWCASE ═════════════════════ */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl overflow-hidden">
            {/* Window Frame Header */}
            <div className="h-11 px-4 flex items-center justify-between border-b border-zinc-800 bg-[#16161a] text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <span className="ml-3 font-medium text-zinc-300">Clarity Workspace</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                <span>Thought Chain: Verified</span>
                <span>•</span>
                <span>Memory Vault: Active</span>
              </div>
            </div>

            {/* Conversation Stream Content */}
            <div className="p-6 md:p-8 bg-[#0d0d10] space-y-6">
              {/* User Prompt */}
              <div className="flex justify-end">
                <div className="max-w-xl rounded-2xl rounded-tr-sm bg-zinc-800 border border-zinc-700/60 px-5 py-3.5 text-sm text-zinc-100">
                  Analyze our project bottlenecks and structure an actionable execution plan for the engineering team.
                </div>
              </div>

              {/* AI Thought & Response */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                  C
                </div>
                <div className="max-w-3xl rounded-2xl rounded-tl-sm bg-[#16161a] border border-zinc-800 p-6 text-sm text-zinc-300 space-y-4 shadow-sm">
                  {/* Reasoning Process Header */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 pb-3 border-b border-zinc-800/80">
                    <Brain className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium text-zinc-300">Thought Process Synthesized</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-500">First-principles breakdown</span>
                  </div>

                  <p className="leading-relaxed text-zinc-200">
                    Here is the clear architectural breakdown categorized into core deliverables, ownership, and
                    immediate risk mitigations:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <span className="font-semibold text-white block">1. Core Engine</span>
                      <span className="text-zinc-400">Low-latency streaming & memory persistence.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <span className="font-semibold text-white block">2. Cowork Kanban</span>
                      <span className="text-zinc-400">Automated task tracking & shared team canvas.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <span className="font-semibold text-white block">3. Security Vault</span>
                      <span className="text-zinc-400">PIN-protected encrypted conversation channels.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ 01. CLARITY IN THOUGHT ═════════════════════ */}
      <section id="thought" className="py-24 px-6 border-b border-zinc-800/60 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              01 // Clear Thinking
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Clarity in Thought. <br />
              Zero Cognitive Overload.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Standard AI tools flood you with unorganized text. Clarity breaks down complex problems using structured
              first-principles logic, isolating core premises before delivering conclusions.
            </p>
            <ul className="space-y-3 pt-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Multi-step reasoning tree without hallucination noise</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Transparent step-by-step synthesis and thought inspection</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span>Custom reasoning personas tailored to specific domain tasks</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-6 p-6 rounded-2xl border border-zinc-800 bg-[#121215] space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-800">
              <span className="font-medium text-white">Thought Architecture</span>
              <span className="font-mono text-zinc-500">Reasoning Chain</span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide block">
                Stage 1: Problem Isolation
              </span>
              <p className="text-zinc-400">Identifies core dependencies and eliminates extraneous variables.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide block">
                Stage 2: Critical Evaluation
              </span>
              <p className="text-zinc-400">Cross-references constraints against memory vault context.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide block">
                Stage 3: High-Signal Delivery
              </span>
              <p className="text-zinc-400">Produces clear, actionable synthesis with verified accuracy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ 02. COWORK CAPABILITIES ═════════════════════ */}
      <section id="cowork" className="py-24 px-6 border-b border-zinc-800/60 bg-[#0d0d10]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
              02 // Cowork Workspace
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Collaborative Intelligence & Artifacts.
            </h2>
            <p className="text-zinc-400 text-base">
              Turn raw conversations into living task boards, memory vaults, and project artifacts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Interactive Kanban */}
            <div className="p-7 rounded-2xl border border-zinc-800 bg-[#141418] flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                  <KanbanIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Autonomous Kanban Boards</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automatically convert discussions into structured task boards with interactive status tracking and
                  deliverables.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                <span>Task Management</span>
                <span className="font-medium text-white">Interactive Canvas</span>
              </div>
            </div>

            {/* Card 2: Memory Vault */}
            <div className="p-7 rounded-2xl border border-zinc-800 bg-[#141418] flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Persistent Memory Vault</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Clarity remembers project rules, user directives, and active persona preferences across all your
                  chats.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                <span>Context Persistence</span>
                <span className="font-medium text-white">Cross-Session Recall</span>
              </div>
            </div>

            {/* Card 3: PIN Locked Vaults */}
            <div className="p-7 rounded-2xl border border-zinc-800 bg-[#141418] flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">PIN-Locked Chat Vaults</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Protect sensitive conversations and confidential notes with client-side 4-digit PIN lock encryption.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                <span>Confidential Channels</span>
                <span className="font-medium text-white">Zero-Knowledge Lock</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ 03. DOWNLOAD MATRIX ═════════════════════ */}
      <section id="downloads" className="py-24 px-6 border-b border-zinc-800/60 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">
            03 // Native Desktop & Web
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Get Clarity for Your Operating System.
          </h2>
          <p className="text-zinc-400 text-base">
            Engineered as a lightweight, fast executable for Windows, macOS, and Linux — plus zero-install cloud access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Windows Download Card */}
          <div className="p-8 rounded-2xl border border-zinc-700 bg-[#121215] flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Windows</h3>
              <p className="text-xs text-zinc-400 mb-5">Windows 10 / 11 (64-bit)</p>

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>One-click setup installer (.exe)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Standalone Portable .exe included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Taskbar JumpList & Toast Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Offline auto-reconnect fallback</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <a
                href="/api/download?type=installer"
                className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Installer (.exe)</span>
              </a>
              <a
                href="/api/download?type=portable"
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Download Portable (.exe)</span>
              </a>
            </div>
          </div>

          {/* macOS Download Card */}
          <div className="p-8 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col justify-between space-y-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">macOS</h3>
              <p className="text-xs text-zinc-400 mb-5">macOS 12 Monterey or later</p>

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Universal DMG (Apple Silicon & Intel)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Spotlight-style global summon</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Retina display high-DPI scaling</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                href="/chat"
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-zinc-700"
              >
                <Download className="w-4 h-4" />
                <span>Download DMG (Universal)</span>
              </Link>
            </div>
          </div>

          {/* Linux Download Card */}
          <div className="p-8 rounded-2xl border border-zinc-800 bg-[#121215] flex flex-col justify-between space-y-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5 text-white">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Linux</h3>
              <p className="text-xs text-zinc-400 mb-5">Ubuntu, Debian, Fedora, Arch</p>

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Universal AppImage binary</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Debian package (.deb)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span>Low memory usage & system tray</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                href="/chat"
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-zinc-700"
              >
                <Download className="w-4 h-4" />
                <span>Download AppImage</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Web Access Callout */}
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Prefer using Clarity online?</h4>
              <p className="text-xs text-zinc-400">
                Access your chat sessions, memory vaults, and cowork boards with zero installation in any web browser.
              </p>
            </div>
          </div>
          <Link
            href="/chat"
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            <span>Launch Web App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═════════════════════ 04. DEVELOPER & CRAFTSMANSHIP ═════════════════════ */}
      <section id="developer" className="py-20 px-6 border-b border-zinc-800/60 bg-[#0d0d10]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
            Crafted for Thinkers & Builders
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Designed & Developed by Shivam Kothekar.
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Clarity was built to restore signal and focus to modern computing. Fast, private, and distraction-free
            intelligence for developers, researchers, and creators.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all"
            >
              Get Started for Free
            </Link>
            <a
              href="https://github.com/ShivamSk07/Mindmate"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-sm font-medium transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═════════════════════ FOOTER ═════════════════════ */}
      <footer className="py-12 px-6 bg-[#070709] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center p-0.5">
              <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-zinc-300">Clarity AI Workspace</span>
            <span>—</span>
            <span>By <strong className="text-zinc-300 font-medium">Shivam Kothekar</strong></span>
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
