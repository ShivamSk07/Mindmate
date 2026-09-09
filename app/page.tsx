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
  Sparkle,
  Radio,
  FileCode2,
  Bell,
  WifiOff,
  Code2,
  Bot,
  Flame,
  KeyRound,
  RefreshCw,
  Copy,
  SlidersHorizontal,
  Workflow,
  Search,
  Eye,
  Activity,
  Fingerprint,
  HardDrive,
  Gauge,
  Compass,
} from "lucide-react";

export default function UniqueLandingPage() {
  const [activeTab, setActiveTab] = useState<"inference" | "reasoning" | "kanban" | "vault">("inference");
  const [selectedOS, setSelectedOS] = useState<"windows" | "mac" | "linux" | "web">("windows");
  const [pinInput, setPinInput] = useState<string>("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [activePersona, setActivePersona] = useState(0);

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

  const handlePinClick = (num: string) => {
    if (pinUnlocked) return;
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      if (next === "2026" || next.length === 4) {
        setPinUnlocked(true);
      }
    }
  };

  const resetPin = () => {
    setPinInput("");
    setPinUnlocked(false);
  };

  const copyCliCommand = (cmd: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(cmd);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2200);
    }
  };

  const personas = [
    {
      name: "Clarity DeepSeek-R1",
      role: "Autonomous Logic & Synthesis",
      speed: "840 t/s",
      tone: "Mathematical, First-Principles, Precise",
      color: "from-blue-500/20 to-cyan-500/20",
      accent: "text-cyan-400",
      border: "border-cyan-500/30",
    },
    {
      name: "Cerebras Llama 3.3 70B",
      role: "Instant Speed Architect",
      speed: "920 t/s",
      tone: "Real-time, Technical, High-Velocity",
      color: "from-amber-500/20 to-orange-500/20",
      accent: "text-amber-400",
      border: "border-amber-500/30",
    },
    {
      name: "Senior Code Synthesizer",
      role: "System Architecture & Refactoring",
      speed: "780 t/s",
      tone: "Idiomatic, Clean Code, Zero-Boilerplate",
      color: "from-emerald-500/20 to-teal-500/20",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    {
      name: "Executive Strategy Engine",
      role: "Briefings & Decision Matrix",
      speed: "810 t/s",
      tone: "Concise, Actionable, Strategic",
      color: "from-purple-500/20 to-pink-500/20",
      accent: "text-purple-400",
      border: "border-purple-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-[#f4f4f5] selection:bg-zinc-800 selection:text-white font-sans antialiased relative overflow-x-hidden overflow-y-auto">
      {/* ── Technical Grid Lines & Ambient Atmosphere ── */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-zinc-700/15 via-zinc-900/5 to-transparent blur-[160px] pointer-events-none -z-10" />

      {/* ═════════════════════ TOP APEX NAV ═════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070709]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#141417] border border-white/10 flex items-center justify-center p-1.5 shadow-inner group-hover:border-zinc-400 transition-all">
                <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white font-mono">CLARITY</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                  v1.0.0
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1 pl-4 border-l border-white/[0.08] text-xs font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              <span>SYS_KERNEL: ACTIVE</span>
              <span className="mx-2">•</span>
              <span>840 T/S ENGINE</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-mono text-zinc-400">
            <a href="#console" className="hover:text-white transition-colors">
              // 01. LIVE_CONSOLE
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              // 02. ARCHITECTURE
            </a>
            <a href="#matrix" className="hover:text-white transition-colors">
              // 03. PERSONAS
            </a>
            <a href="#deck" className="hover:text-white transition-colors">
              // 04. HARDWARE_DECK
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-mono text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              [ SIGN IN ]
            </Link>
            <Link
              href="/chat"
              className="text-xs font-mono font-medium px-4 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>LAUNCH WEB</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════ HERO: ASYMMETRIC COMMAND STAGE ═════════════════════ */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Metric Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-12 border-b border-white/[0.06] text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">+</span>
              <span className="text-zinc-400">STATUS:</span>
              <span className="text-emerald-400">READY_FOR_DEPLOYMENT</span>
            </div>
            <div className="flex items-center gap-6">
              <span>LATENCY: &lt;0.18s</span>
              <span>MEMORY_VAULT: ENCRYPTED</span>
              <span>DESKTOP_BUILD: WIN/MAC/LINUX</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Bold Asymmetric Typography */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Next-Gen Autonomous AI Workspace</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                Think at the Speed of{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-300 to-zinc-600">
                  Unbounded Reasoning.
                </span>
              </h1>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Clarity converges sub-second multi-model inference, persistent cross-chat memory vaults, visual Kanban
                synthesis, and client-encrypted vaults into a single charcoal desktop console.
              </p>

              {/* Primary Dual CTA Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href="/api/download?type=installer"
                  className="px-6 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-xs font-mono flex items-center justify-center gap-2.5 shadow-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-zinc-950" />
                  <span>DOWNLOAD SETUP (.EXE)</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-[10px] text-zinc-800 font-bold">180MB</span>
                </a>

                <Link
                  href="/chat"
                  className="px-5 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center justify-center gap-2 transition-all hover:border-zinc-700"
                >
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>OPEN CLOUD WORKSPACE</span>
                </Link>
              </div>

              {/* Terminal Quick Protocol Hint */}
              <div className="pt-2 flex items-center gap-3 text-xs font-mono text-zinc-500">
                <span>Protocol:</span>
                <code
                  onClick={() => copyCliCommand("clarity://chat")}
                  className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-zinc-300 cursor-pointer hover:border-zinc-500 transition-all flex items-center gap-1.5"
                  title="Click to copy URI"
                >
                  <span>clarity://chat</span>
                  {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                </code>
                <span className="text-[11px] text-zinc-600">(Deep link ready)</span>
              </div>
            </div>

            {/* Right Column: Interactive "Playable" Neural Console */}
            <div id="console" className="lg:col-span-6">
              <div className="rounded-2xl border border-white/[0.1] bg-[#0e0e11] p-2 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
                {/* Console Tab Selectors */}
                <div className="flex items-center justify-between p-2 pb-3 border-b border-white/[0.08] bg-[#131316] rounded-t-xl gap-1 overflow-x-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <button
                      onClick={() => setActiveTab("inference")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeTab === "inference"
                          ? "bg-white text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      ⚡ Inference
                    </button>
                    <button
                      onClick={() => setActiveTab("reasoning")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeTab === "reasoning"
                          ? "bg-white text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      🧠 Reasoning
                    </button>
                    <button
                      onClick={() => setActiveTab("kanban")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeTab === "kanban"
                          ? "bg-white text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      📊 Kanban
                    </button>
                    <button
                      onClick={() => setActiveTab("vault")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeTab === "vault"
                          ? "bg-white text-zinc-950 font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      🔒 PIN Vault
                    </button>
                  </div>
                </div>

                {/* Dynamic Console Stage Content */}
                <div className="p-6 bg-[#09090b] rounded-b-xl min-h-[380px] flex flex-col justify-between">
                  {/* TAB 1: INFERENCE ENGINE */}
                  {activeTab === "inference" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-mono font-bold text-white">Cerebras Llama 3.3 70B</span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          840 tokens / sec
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="p-3 rounded-lg bg-[#141417] border border-white/[0.04] text-zinc-400">
                          <span className="text-zinc-500 block mb-1">&gt; PROMPT:</span>
                          <span className="text-zinc-200">
                            "Benchmark system memory throughput vs latency fallbacks on Windows 11."
                          </span>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#121215] border border-white/[0.08] text-zinc-300 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-white/[0.04] pb-1.5">
                            <span className="text-cyan-400">OUTPUT_STREAM (COMPLETED in 0.21s)</span>
                            <span>TOKENS: 312</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            Memory throughput achieves <strong>48 GB/s native bandwidth</strong> with zero-delay
                            offline failover. Taskbar telemetry and desktop context persist without IPC latency.
                          </p>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-[94%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DEEP REASONING */}
                  {activeTab === "reasoning" && (
                    <div className="space-y-3 animate-in fade-in duration-300 text-xs font-mono">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                        <span className="text-purple-400 font-bold">DeepSeek-R1 Chain of Thought</span>
                        <span className="text-zinc-500">DEPTH: 4 STAGES</span>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2.5 rounded bg-[#121215] border border-purple-500/20 text-zinc-300">
                          <span className="text-purple-400 block text-[10px] font-bold">[STEP 1: ROOT DECOMPOSITION]</span>
                          Analyzing system state memory and multi-window bounds lifecycle...
                        </div>
                        <div className="p-2.5 rounded bg-[#121215] border border-cyan-500/20 text-zinc-300">
                          <span className="text-cyan-400 block text-[10px] font-bold">[STEP 2: ENCRYPTION VALIDATION]</span>
                          Zero-knowledge local PIN verification confirmed with SHA-512 hashing.
                        </div>
                        <div className="p-2.5 rounded bg-[#121215] border border-emerald-500/20 text-zinc-300">
                          <span className="text-emerald-400 block text-[10px] font-bold">[STEP 3: SYNTHESIS COMPLETE]</span>
                          Architectural roadmap synthesized with verified 99.98% reliability score.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE KANBAN */}
                  {activeTab === "kanban" && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs font-mono">
                        <span className="text-white font-bold">Clarity Autonomous Task Board</span>
                        <span className="text-zinc-500">3 COLUMNS</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-[#121215] border border-white/[0.06] space-y-2">
                          <span className="text-[10px] text-zinc-400 font-bold block">TODO [2]</span>
                          <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-[11px] text-zinc-300">
                            Offline Cache Sync
                          </div>
                          <div className="p-2 rounded bg-black/40 border border-white/[0.04] text-[11px] text-zinc-300">
                            Mica Titlebar Polish
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#121215] border border-blue-500/20 space-y-2">
                          <span className="text-[10px] text-blue-400 font-bold block">IN PROGRESS [1]</span>
                          <div className="p-2 rounded bg-black/40 border border-blue-500/30 text-[11px] text-zinc-200">
                            Neural Vector Vault
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#121215] border border-emerald-500/20 space-y-2">
                          <span className="text-[10px] text-emerald-400 font-bold block">DONE [2]</span>
                          <div className="p-2 rounded bg-black/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                            Windows Setup (.exe)
                          </div>
                          <div className="p-2 rounded bg-black/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                            Toast Alerts
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PIN-LOCKED VAULT (INTERACTIVE DEMO) */}
                  {activeTab === "vault" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs font-mono">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <FolderLock className="w-3.5 h-3.5" /> PIN Vault Security
                        </span>
                        <span className="text-zinc-500">TEST PIN: [ 2 0 2 6 ]</span>
                      </div>

                      {pinUnlocked ? (
                        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                          <h4 className="text-sm font-bold text-white font-mono">VAULT DECRYPTED</h4>
                          <p className="text-xs text-zinc-400">
                            Confidential project files and sensitive AI chats are now readable.
                          </p>
                          <button
                            onClick={resetPin}
                            className="px-3 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-300 hover:bg-zinc-700"
                          >
                            Lock Vault Again
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2 space-y-3">
                          <div className="flex gap-2">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`w-3.5 h-3.5 rounded-full border ${
                                  pinInput.length > i
                                    ? "bg-amber-400 border-amber-400"
                                    : "bg-transparent border-zinc-700"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 w-44">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((btn) => (
                              <button
                                key={btn}
                                onClick={() => (btn === "C" ? setPinInput("") : handlePinClick(btn))}
                                className="py-2 text-xs font-mono font-bold rounded bg-[#161619] hover:bg-zinc-700 border border-white/5 text-zinc-200 transition-colors"
                              >
                                {btn}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage Footer Status */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      ENGINE STATUS: OPTIMAL
                    </span>
                    <span>CLARITY_CORE_V1.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ 02. HARDWARE PLATFORM DECK (THE REPLACED COMMON GRID) ═════════════════════ */}
      <section id="deck" className="py-24 px-6 border-t border-white/[0.08] bg-[#0a0a0d] relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
                // 02. PLATFORM MATRIX
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                The Hardware Control Deck.
              </h2>
            </div>
            <p className="text-zinc-400 text-sm max-w-md font-mono">
              Switch platforms to inspect native binaries, command-line installers, and architectural prerequisites.
            </p>
          </div>

          {/* Big Interactive Deck Hub */}
          <div className="rounded-2xl border border-white/[0.1] bg-[#111114] p-2 md:p-4 shadow-2xl">
            {/* Platform Selector Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setSelectedOS("windows")}
                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3.5 ${
                  selectedOS === "windows"
                    ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                    : "bg-[#16161a] text-zinc-400 border-white/[0.06] hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Monitor className={`w-5 h-5 ${selectedOS === "windows" ? "text-zinc-950" : "text-zinc-400"}`} />
                <div>
                  <span className="text-xs font-mono block">Windows OS</span>
                  <span className="text-[11px] opacity-75 font-mono">x64 Installer & Portable</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedOS("mac")}
                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3.5 ${
                  selectedOS === "mac"
                    ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                    : "bg-[#16161a] text-zinc-400 border-white/[0.06] hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Laptop className={`w-5 h-5 ${selectedOS === "mac" ? "text-zinc-950" : "text-zinc-400"}`} />
                <div>
                  <span className="text-xs font-mono block">macOS</span>
                  <span className="text-[11px] opacity-75 font-mono">Apple Silicon & Intel</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedOS("linux")}
                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3.5 ${
                  selectedOS === "linux"
                    ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                    : "bg-[#16161a] text-zinc-400 border-white/[0.06] hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Terminal className={`w-5 h-5 ${selectedOS === "linux" ? "text-zinc-950" : "text-zinc-400"}`} />
                <div>
                  <span className="text-xs font-mono block">Linux</span>
                  <span className="text-[11px] opacity-75 font-mono">AppImage & .deb</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedOS("web")}
                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3.5 ${
                  selectedOS === "web"
                    ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                    : "bg-[#16161a] text-zinc-400 border-white/[0.06] hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Globe className={`w-5 h-5 ${selectedOS === "web" ? "text-zinc-950" : "text-zinc-400"}`} />
                <div>
                  <span className="text-xs font-mono block">Cloud Web</span>
                  <span className="text-[11px] opacity-75 font-mono">Zero Installation</span>
                </div>
              </button>
            </div>

            {/* Deck Console Display for Selected OS */}
            <div className="rounded-xl border border-white/[0.06] bg-[#08080a] p-6 md:p-8">
              {selectedOS === "windows" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                      <Check className="w-3.5 h-3.5" /> PRODUCTION BUILD VERIFIED
                    </div>
                    <h3 className="text-2xl font-bold text-white">Clarity for Windows 10 & 11 (64-bit)</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Packaged with native NSIS one-click installer, JumpList taskbar actions, offline fallback guard,
                      and window position memory.
                    </p>

                    <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-mono text-zinc-300">
                      <div className="p-3 rounded-lg bg-[#141418] border border-white/5">
                        <span className="text-zinc-400 block text-[10px]">PACKAGE SIZE</span>
                        <span className="text-white font-bold">180 MB</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#141418] border border-white/5">
                        <span className="text-zinc-400 block text-[10px]">PUBLISHER & ID</span>
                        <span className="text-white font-bold">in.shivamkothekar.clarity</span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-wrap gap-3">
                      <a
                        href="/api/download?type=installer"
                        className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD INSTALLER (.EXE)</span>
                      </a>
                      <a
                        href="/api/download?type=portable"
                        className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-2 transition-all"
                      >
                        <span>DOWNLOAD PORTABLE (.EXE)</span>
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-xl bg-[#121216] border border-white/[0.08] font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-white/5">
                      <span>TERMINAL COMMAND</span>
                      <button
                        onClick={() => copyCliCommand("winget install shivamkothekar.clarity")}
                        className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <code className="text-emerald-400 block p-2 rounded bg-black/50 border border-white/5 overflow-x-auto">
                      winget install shivamkothekar.clarity
                    </code>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Automatically installs, registers registry shortcuts, and configures background response
                      notifications.
                    </p>
                  </div>
                </div>
              )}

              {selectedOS === "mac" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
                      <Laptop className="w-3.5 h-3.5" /> UNIVERSAL BINARY READY
                    </div>
                    <h3 className="text-2xl font-bold text-white">Clarity for macOS (Apple Silicon & Intel)</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Native Cocoa frame with Mica transparency, Spotlight summon shortcuts, and zero-fan CPU efficiency.
                    </p>
                    <div className="pt-4 flex gap-3">
                      <Link
                        href="/chat"
                        className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD UNIVERSAL DMG</span>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-xl bg-[#121216] border border-white/[0.08] font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-white/5">
                      <span>HOMEBREW CASK</span>
                      <button
                        onClick={() => copyCliCommand("brew install --cask clarity")}
                        className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <code className="text-cyan-400 block p-2 rounded bg-black/50 border border-white/5 overflow-x-auto">
                      brew install --cask clarity
                    </code>
                  </div>
                </div>
              )}

              {selectedOS === "linux" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded">
                      <Terminal className="w-3.5 h-3.5" /> LINUX X86_64
                    </div>
                    <h3 className="text-2xl font-bold text-white">Clarity for Linux Distributions</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Compatible with Ubuntu, Debian, Fedora, Arch, and Wayland/X11 compositors.
                    </p>
                    <div className="pt-4 flex gap-3">
                      <Link
                        href="/chat"
                        className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD APPIMAGE</span>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-xl bg-[#121216] border border-white/[0.08] font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-white/5">
                      <span>DEBIAN APT</span>
                      <button
                        onClick={() => copyCliCommand("sudo apt install ./clarity.deb")}
                        className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <code className="text-purple-400 block p-2 rounded bg-black/50 border border-white/5 overflow-x-auto">
                      sudo apt install ./clarity_1.0.0_amd64.deb
                    </code>
                  </div>
                </div>
              )}

              {selectedOS === "web" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                      <Globe className="w-3.5 h-3.5" /> ZERO INSTALLATION REQUIRED
                    </div>
                    <h3 className="text-2xl font-bold text-white">Clarity Cloud Web Application</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Run all AI models, interactive Kanban boards, and document synthesis in any Chrome, Safari, or
                      Firefox browser.
                    </p>
                    <div className="pt-4 flex gap-3">
                      <Link
                        href="/chat"
                        className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-md"
                      >
                        <span>LAUNCH WEB APPLICATION</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ 03. INTERACTIVE PERSONA MATRIX ═════════════════════ */}
      <section id="matrix" className="py-24 px-6 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
              // 03. SPECIALIZED INTELLIGENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Switch Thinking Modes Instantly.
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              Clarity adapts its system prompt, tone directives, and reasoning architecture based on your task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personas.map((p, idx) => (
              <div
                key={p.name}
                onClick={() => setActivePersona(idx)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer bg-[#0e0e11] hover:scale-[1.02] flex flex-col justify-between ${
                  activePersona === idx
                    ? `${p.border} shadow-lg shadow-black/80 bg-gradient-to-b ${p.color}`
                    : "border-white/[0.06] hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-zinc-500">0{idx + 1} // PERSONA</span>
                    <span className={`text-xs font-mono font-bold ${p.accent}`}>{p.speed}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{p.name}</h4>
                  <span className="text-xs font-mono text-zinc-400 block mb-4">{p.role}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{p.tone}</p>
                </div>

                <div className="pt-6 border-t border-white/[0.06] mt-6 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">DIRECTIVE</span>
                  <span className={activePersona === idx ? p.accent : "text-zinc-400"}>
                    {activePersona === idx ? "● ACTIVE" : "SELECT"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════ 04. ARCHITECTURAL BLUEPRINT ═════════════════════ */}
      <section id="architecture" className="py-24 px-6 border-t border-white/[0.08] bg-[#0a0a0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2 block">
              // 04. CORE KERNEL BLUEPRINT
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Triple-Layer Engineered Architecture.
            </h2>
          </div>

          <div className="space-y-4">
            {/* Layer 1 */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-[#101014] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold">
                  01
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">Cognitive Inference Mesh</h4>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Multi-provider routing across Cerebras Wafer-Scale Engine, Groq LPUs, and DeepSeek reasoning logic.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 whitespace-nowrap">
                SUB-200MS TTFT
              </span>
            </div>

            {/* Layer 2 */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-[#101014] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold">
                  02
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">Persistent Neural Memory Vault</h4>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Client-side encrypted SQLite storage, custom persona injection, and zero-knowledge 4-digit PIN locks.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-400 px-3 py-1 rounded bg-purple-500/10 border border-purple-500/20 whitespace-nowrap">
                ZERO-DATA LOGGING
              </span>
            </div>

            {/* Layer 3 */}
            <div className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-[#101014] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold">
                  03
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">Native Desktop OS Runtime</h4>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Windows JumpList shortcuts, taskbar response glow, window bounds persistence, and auto-offline recovery.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
                C++ & ELECTRON KERNEL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════ APEX CTA BANNER ═════════════════════ */}
      <section className="py-24 px-6 border-t border-white/[0.08] relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DEPLOY CLARITY TODAY</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Experience High-Speed AI Synthesis.
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto font-mono">
            Get the native desktop app or create a free account to launch the cloud workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/api/download?type=installer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FOR WINDOWS (.EXE)</span>
            </a>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-mono text-xs transition-all"
            >
              CREATE CLOUD ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════ FOOTER ═════════════════════ */}
      <footer className="border-t border-white/[0.08] py-12 px-6 bg-[#050507] text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center p-0.5">
              <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-zinc-300">CLARITY // AI</span>
            <span>—</span>
            <span>Created by <strong className="text-zinc-200">Shivam Kothekar</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              [ PRIVACY ]
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              [ TERMS ]
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              [ LOGIN ]
            </Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">
              [ SIGNUP ]
            </Link>
          </div>

          <div className="text-zinc-600">
            © {new Date().getFullYear()} Shivam Kothekar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
