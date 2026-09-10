"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ArrowRight,
  ArrowDown,
  Check,
  Copy,
  Folder,
  Lock,
  Clock,
  FileText,
  Code2,
  List,
  Calendar,
  User,
  Sparkles,
  Terminal,
  Mail,
  Zap,
  BookOpen,
  Users,
} from "lucide-react";

export default function ClarityLandingPage() {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [copied, setCopied] = useState(false);
  const [pinDots, setPinDots] = useState<number>(1);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Copy CLI command to clipboard
  const copyCliCommand = () => {
    navigator.clipboard.writeText("curl -fsSL https://clarity.indevs.in/install.sh | bash");
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  // Interactive PIN simulation
  const handlePinClick = () => {
    if (pinDots >= 5) {
      setPinDots(1);
      setPinSuccess(false);
    } else {
      const next = pinDots + 1;
      setPinDots(next);
      if (next === 5) {
        setPinSuccess(true);
        setTimeout(() => {
          setPinSuccess(false);
          setPinDots(1);
        }, 2200);
      }
    }
  };

  // Newsletter subscribe
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
    }, 2500);
  };

  // Scroll reveal + active nav tracker
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = ["hero", "downloads", "cowork", "memory-vault", "builder-note", "footer-section"];
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    const reveals = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );

    reveals.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      reveals.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-container bg-[#050507] text-[#f4f4f7] antialiased selection:bg-white/20 selection:text-white overflow-x-hidden">

      {/* ═══════════════════════ GLOBAL HEADER ═══════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050507]/90 backdrop-blur-xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-6 h-[64px] flex items-center justify-between">
          {/* Brand Logo — using the actual Clarity logo.png */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/img/logo.png"
                alt="Clarity Logo"
                fill
                className="object-contain group-hover:opacity-90 transition-opacity"
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">Clarity</span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: "downloads", label: "Downloads" },
              { id: "cowork", label: "Cowork" },
              { id: "memory-vault", label: "Capabilities" },
              { id: "builder-note", label: "Builder Note" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`relative px-3.5 py-1.5 text-[13px] font-medium transition-all rounded-full ${
                  activeSection === id
                    ? "text-white bg-white/[0.08] border border-white/15"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
                {activeSection === id && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                )}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[13px] text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-zinc-200 transition-all duration-200 shadow-[0_2px_12px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <span>Try Free</span>
              <ArrowRight size={13} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════ 01 — HERO ═══════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center border-b border-white/[0.06] overflow-hidden bg-[#050507]"
      >
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.07)_0%,transparent_65%)] pointer-events-none" />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 w-full relative z-10 flex flex-col items-center text-center pt-24 pb-16">

          {/* Eyebrow Pill */}
          <div className="reveal-on-scroll inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111116] border border-white/10 text-zinc-300 text-[12px] font-medium mb-7 shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>Autonomous AI Workspace for Developers</span>
          </div>

          {/* Main Headline */}
          <h1 className="reveal-on-scroll text-[clamp(52px,8vw,96px)] font-bold tracking-[-0.04em] text-white leading-[1.01] mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Clarity in devs.
          </h1>

          {/* Subtitle */}
          <p className="reveal-on-scroll text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal mb-8">
            Pure thought. Pure response. An autonomous cowork engine
            <br className="hidden sm:inline" />
            for developers who want zero filler and real progress.
          </p>

          {/* Download Buttons Row */}
          <div className="reveal-on-scroll flex flex-wrap items-center justify-center gap-3 mb-5">
            {/* Windows — solid white primary */}
            <a
              href="/api/download?type=installer"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.751" />
              </svg>
              <span>Windows</span>
              <ArrowDown size={12} strokeWidth={2.4} />
            </a>

            {/* macOS */}
            <a
              href="#downloads"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#0e0e13] border border-white/15 text-zinc-200 text-xs font-medium hover:bg-[#161620] hover:border-white/25 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.82.93-2.87-1 .04-2.2.67-2.91 1.5-.56.64-.99 1.7-.86 2.72 1.13.09 2.21-.59 2.84-1.35z" />
              </svg>
              <span>macOS</span>
              <ArrowDown size={12} strokeWidth={2.4} />
            </a>

            {/* Linux */}
            <a
              href="#downloads"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#0e0e13] border border-white/15 text-zinc-200 text-xs font-medium hover:bg-[#161620] hover:border-white/25 transition-all active:scale-95"
            >
              <Terminal size={14} strokeWidth={2} />
              <span>Linux</span>
              <ArrowDown size={12} strokeWidth={2.4} />
            </a>
          </div>

          {/* "or" separator */}
          <div className="reveal-on-scroll flex items-center gap-3 max-w-[240px] mx-auto mb-4">
            <span className="flex-1 h-[1px] bg-white/10" />
            <span className="text-zinc-500 text-[11px] font-mono">or</span>
            <span className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Try in Browser */}
          <div className="reveal-on-scroll mb-12">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0e0e13] border border-white/15 text-zinc-200 text-xs font-medium hover:bg-[#161620] hover:border-white/25 transition-all active:scale-95"
            >
              <span>Try in Browser</span>
              <ArrowRight size={13} className="text-zinc-400" />
            </Link>
          </div>

          {/* App Mockup Visual */}
          <div className="reveal-on-scroll relative max-w-3xl mx-auto w-full">
            {/* Side vertical text */}
            <div className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 text-right text-[9px] font-mono tracking-[0.3em] text-zinc-600 leading-loose z-20">
              THINK<br />BUILD<br />SHIP<br />CLEARER
            </div>

            {/* Laptop Lid Mockup */}
            <div className="relative mx-auto w-full max-w-[520px] rounded-t-2xl bg-gradient-to-b from-[#14151c] via-[#0e0f14] to-[#07070a] border-t-2 border-x-2 border-white/[0.18] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Window chrome bar */}
              <div className="h-9 bg-[#0f1014] border-b border-white/[0.07] flex items-center px-4 gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <div className="ml-4 flex items-center gap-1.5">
                  <div className="w-4 h-4 relative flex-shrink-0">
                    <Image src="/img/logo.png" alt="Clarity" fill className="object-contain" />
                  </div>
                  <span className="text-[11px] text-white font-medium">Clarity</span>
                </div>
              </div>

              {/* App UI preview */}
              <div className="grid grid-cols-12 min-h-[260px] bg-[#070709]">
                {/* Sidebar */}
                <div className="col-span-3 border-r border-white/[0.06] p-3 bg-[#09090d]">
                  <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] mb-3 text-[10px] text-white flex items-center justify-between">
                    <span>+ New Chat</span>
                    <kbd className="text-zinc-500 font-mono">⌘K</kbd>
                  </div>
                  <nav className="space-y-0.5 text-[10px]">
                    <div className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />Chat
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md text-zinc-500 flex items-center gap-2">
                      <Folder size={11} />Projects
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md text-zinc-500 flex items-center gap-2">
                      <Lock size={11} />Memory
                    </div>
                    <div className="px-2.5 py-1.5 rounded-md text-zinc-500 flex items-center gap-2">
                      <Sparkles size={11} />Settings
                    </div>
                  </nav>
                </div>

                {/* Main canvas */}
                <div className="col-span-9 p-6 flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-medium text-zinc-200 mb-5">How can I help you build today?</h3>
                  <div className="w-full max-w-md rounded-xl bg-[#111116] border border-white/10 p-3.5 text-left">
                    <p className="text-[11px] text-zinc-500 mb-3">Ask, plan, build...</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        {["Code", "Refactor", "Explain"].map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center">
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Planet horizon glow at base */}
            <div className="relative h-10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.3)_0%,transparent_70%)]" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
            </div>
          </div>

          {/* Bottom microcopy */}
          <div className="mt-6 w-full flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono tracking-[0.2em] text-zinc-600 uppercase">
            <span>BUILT FOR A CLEARER TOMORROW</span>
            <div className="flex items-center gap-1.5 text-zinc-500 my-2 sm:my-0">
              <ArrowDown size={11} />
              <span>SCROLL TO EXPLORE</span>
            </div>
            <span>BY SHIVAM KOTHEKAR</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 02 — DOWNLOADS ═══════════════════════ */}
      <section
        id="downloads"
        className="relative min-h-screen flex items-center border-b border-white/[0.06] bg-[#050507] overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 w-full py-24 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 reveal-on-scroll">
            <span className="text-[11px] font-medium tracking-[0.25em] text-zinc-500 uppercase block mb-4">
              AVAILABLE EVERYWHERE
            </span>
            <h2 className="text-[clamp(36px,5vw,64px)] font-bold tracking-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="text-white">Clarity</span>{" "}
              <span className="text-zinc-400 font-normal">on your system.</span>
            </h2>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
              A native experience for a faster, quieter, more focused workflow.
            </p>
          </div>

          {/* 4 Platform Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12 reveal-on-scroll">
            {/* Windows — highlighted */}
            <div className="rounded-2xl bg-[#080d0a] border-2 border-emerald-500/60 p-6 flex flex-col justify-between h-[210px] shadow-[0_0_35px_-5px_rgba(16,185,129,0.2)] hover:border-emerald-400 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 mb-4 flex items-center justify-center text-white">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.751" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Windows</h3>
                <p className="text-xs text-zinc-500">10/11 • x64 / ARM64</p>
              </div>
              <div className="flex justify-center">
                <a
                  href="/api/download?type=installer"
                  className="w-10 h-10 rounded-full bg-emerald-400 text-black flex items-center justify-center hover:bg-emerald-300 hover:scale-105 transition-all shadow-md shadow-emerald-500/30"
                >
                  <Download size={17} strokeWidth={2.4} />
                </a>
              </div>
            </div>

            {/* macOS */}
            <div className="rounded-2xl bg-[#09090d] border border-white/10 p-6 flex flex-col justify-between h-[210px] hover:border-white/20 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 mb-4 flex items-center justify-center text-white">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.82.93-2.87-1 .04-2.2.67-2.91 1.5-.56.64-.99 1.7-.86 2.72 1.13.09 2.21-.59 2.84-1.35z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">macOS</h3>
                <p className="text-xs text-zinc-500">Apple Silicon & Intel</p>
              </div>
              <div className="flex justify-center">
                <a
                  href="#downloads"
                  className="w-10 h-10 rounded-full bg-[#131318] border border-white/15 text-zinc-200 flex items-center justify-center hover:bg-[#1a1a22] hover:text-white transition-all"
                >
                  <Download size={16} strokeWidth={2} />
                </a>
              </div>
            </div>

            {/* Linux */}
            <div className="rounded-2xl bg-[#09090d] border border-white/10 p-6 flex flex-col justify-between h-[210px] hover:border-white/20 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 mb-4 flex items-center justify-center text-white">
                  <Terminal size={28} strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Linux</h3>
                <p className="text-xs text-zinc-500">Ubuntu, Debian, Fedora</p>
              </div>
              <div className="flex justify-center">
                <a
                  href="#downloads"
                  className="w-10 h-10 rounded-full bg-[#131318] border border-white/15 text-zinc-200 flex items-center justify-center hover:bg-[#1a1a22] hover:text-white transition-all"
                >
                  <Download size={16} strokeWidth={2} />
                </a>
              </div>
            </div>

            {/* Web */}
            <div className="rounded-2xl bg-[#09090d] border border-white/10 p-6 flex flex-col justify-between h-[210px] hover:border-white/20 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 mb-4 flex items-center justify-center text-white">
                  <svg className="w-7 h-7 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Web</h3>
                <p className="text-xs text-zinc-500">Instant access, no install</p>
              </div>
              <div className="flex justify-center">
                <Link
                  href="/chat"
                  className="w-10 h-10 rounded-full bg-[#131318] border border-white/15 text-zinc-200 flex items-center justify-center hover:bg-[#1a1a22] hover:text-white transition-all"
                >
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>

          {/* CLI Command Bar */}
          <div className="max-w-2xl mx-auto reveal-on-scroll">
            <div className="rounded-xl bg-[#0c0c10]/95 border border-white/10 px-5 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-zinc-500 font-mono text-sm">$</span>
                <code className="text-xs sm:text-[13px] text-zinc-300 font-mono truncate select-all">
                  curl -fsSL https://clarity.indevs.in/install.sh | bash
                </code>
              </div>
              <button
                onClick={copyCliCommand}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-all active:scale-95 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <span>Copy</span>
                    <Copy size={13} className="text-zinc-400" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 03 — COWORK ═══════════════════════ */}
      <section
        id="cowork"
        className="relative min-h-screen flex items-center border-b border-white/[0.06] bg-[#050507] overflow-hidden"
      >
        {/* Ambient celestial sphere */}
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_30%_30%,#080c14_0%,#050507_75%)] border border-cyan-500/[0.07] shadow-[0_0_100px_rgba(56,189,248,0.06)] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 w-full py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Text */}
            <div className="lg:col-span-5 text-left reveal-on-scroll">
              <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-500 uppercase block mb-5">
                COWORK
              </span>
              <h2 className="text-[clamp(36px,4.5vw,58px)] font-bold tracking-tight text-white leading-[1.07] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Bring your<br />
                dev world<br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  together.
                </span>
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-md">
                Connect your code, tools, and accounts — so Clarity can understand your context and work with you.
              </p>
              <div className="mb-12">
                <Link
                  href="/cowork"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-zinc-200 transition-all shadow-[0_2px_15px_rgba(255,255,255,0.15)] active:scale-95"
                >
                  <span>Connect tools</span>
                  <ArrowRight size={14} strokeWidth={2.2} />
                </Link>
              </div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase">
                LESS SWITCHING<br />MORE BUILDING
              </div>
            </div>

            {/* Right: Connected Node Diagram */}
            <div className="lg:col-span-7 relative reveal-on-scroll">
              {/* Handwritten callout */}
              <div className="absolute -top-10 right-8 z-20 hidden sm:block text-right">
                <p className="font-caveat text-blue-300 text-xl leading-tight tracking-wide rotate-[-3deg]">
                  Less switching.<br />More building.
                </p>
                <svg className="w-7 h-7 text-blue-400/70 ml-auto mt-1" viewBox="0 0 40 40" fill="none" stroke="currentColor">
                  <path d="M5 5 C 10 25, 25 30, 35 32" strokeWidth="1.5" strokeDasharray="3 3" />
                  <polyline points="28,32 35,32 34,25" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
                {/* Source tool cards */}
                <div className="space-y-4 w-full md:w-[185px] z-10">
                  {[
                    {
                      icon: (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      ),
                      bg: "bg-black",
                      label: "GitHub",
                    },
                    {
                      icon: (
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 1L24 22H0L12 1Z" />
                        </svg>
                      ),
                      bg: "bg-black",
                      label: "Vercel",
                    },
                    {
                      icon: <span className="text-[11px] font-bold">in</span>,
                      bg: "bg-[#0077b5]",
                      label: "LinkedIn",
                    },
                  ].map(({ icon, bg, label }) => (
                    <div key={label} className="rounded-xl bg-[#0c0c12]/90 border border-white/15 p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg">
                      <div className={`w-8 h-8 rounded-lg ${bg} border border-white/10 flex items-center justify-center text-white flex-shrink-0`}>
                        {icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{label}</h4>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                          Connected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Central hub with Clarity logo */}
                <div className="relative z-10 flex items-center justify-center">
                  {/* Glow rings */}
                  <div className="absolute w-24 h-24 rounded-full border border-cyan-400/20 animate-pulse" />
                  <div className="absolute w-32 h-32 rounded-full border border-cyan-400/10" />
                  <div className="w-16 h-16 rounded-2xl bg-[#0c0e17] border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.3)] flex items-center justify-center p-2.5">
                    <div className="w-full h-full relative">
                      <Image src="/img/logo.png" alt="Clarity" fill className="object-contain" />
                    </div>
                  </div>
                </div>

                {/* Right context panel */}
                <div className="w-full md:w-[265px] rounded-2xl bg-[#0b0c13]/90 border border-white/15 p-5 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 text-left">
                  <h4 className="text-sm font-semibold text-white mb-1">Everything in context.</h4>
                  <p className="text-[11px] text-zinc-400 mb-4">Your code. Your tools. Your journey.</p>
                  <div className="p-2.5 rounded-xl bg-[#12131d] border border-white/10 mb-4 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Ask, plan, build...</span>
                    <button className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                      <ArrowRight size={9} className="-rotate-45" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
                    {["GitHub", "Vercel", "in"].map((t, i) => (
                      <span key={i} className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 text-[9px] font-bold">
                        {t === "GitHub" ? (
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                        ) : t === "Vercel" ? (
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 1L24 22H0L12 1Z" /></svg>
                        ) : t}
                      </span>
                    ))}
                    <span className="text-[9px] text-zinc-400 font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/10">+ more</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-right text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase">
                BUILT FOR<br />WHAT&apos;S NEXT
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 04 — MEMORY VAULT ═══════════════════════ */}
      <section
        id="memory-vault"
        className="relative min-h-screen flex items-center border-b border-white/[0.06] bg-[#050507] overflow-hidden"
      >
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 w-full py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Content */}
            <div className="lg:col-span-5 text-left reveal-on-scroll">
              <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase block mb-5">
                MEMORY VAULT
              </span>
              <h2 className="text-[clamp(36px,4.5vw,58px)] font-bold tracking-tight text-white leading-[1.07] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your progress,<br />always with you.
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-md">
                Save ideas, code, notes or full projects. Keep what matters — locked with a PIN, and ready whenever you need it.
              </p>

              {/* Feature rows */}
              <div className="space-y-6 mb-10">
                {[
                  { icon: <Folder size={16} />, title: "Store anything", desc: "Ideas, snippets, docs, plans." },
                  { icon: <Lock size={16} />, title: "Protected by you", desc: "Secure with a PIN." },
                  { icon: <Clock size={16} />, title: "Access anywhere", desc: "Same context, every time." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#111118] border border-white/10 flex items-center justify-center text-zinc-300 flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{title}</h4>
                      <p className="text-xs text-zinc-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-12">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-zinc-200 transition-all shadow-[0_2px_15px_rgba(255,255,255,0.15)] active:scale-95"
                >
                  <span>Open Memory Vault</span>
                  <ArrowRight size={14} strokeWidth={2.2} />
                </Link>
              </div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase">
                YOUR WORK. SAFER. CLEARER.
              </div>
            </div>

            {/* Right: Vault Visual */}
            <div className="lg:col-span-7 relative flex items-center justify-center min-h-[460px] reveal-on-scroll">
              {/* Orbital ring */}
              <div className="absolute w-[420px] h-[420px] rounded-full border border-white/[0.07] pointer-events-none" />

              {/* Floating badges */}
              {[
                { icon: <FileText size={12} className="text-zinc-400" />, label: "Ideas", cls: "top-12 left-10" },
                { icon: <Code2 size={12} className="text-zinc-400" />, label: "Code", cls: "top-1/2 -translate-y-12 left-2" },
                { icon: <List size={12} className="text-zinc-400" />, label: "Notes", cls: "bottom-16 left-8" },
                { icon: <Folder size={12} className="text-zinc-400" />, label: "Projects", cls: "top-16 right-8" },
                { icon: <Calendar size={12} className="text-zinc-400" />, label: "Plans", cls: "top-1/2 -translate-y-8 right-2" },
                { icon: <User size={12} className="text-zinc-400" />, label: "Personal", cls: "bottom-20 right-10" },
              ].map(({ icon, label, cls }) => (
                <div key={label} className={`absolute ${cls} z-20 px-2.5 py-1.5 rounded-xl bg-[#0c0d14]/90 border border-white/15 text-xs text-zinc-200 flex items-center gap-2 shadow-lg backdrop-blur-md`}>
                  {icon}<span>{label}</span>
                </div>
              ))}

              {/* Stacked glass cards */}
              <div className="relative w-[260px] h-[320px]">
                <div className="absolute inset-0 rounded-3xl bg-[#0e1019]/30 border border-white/[0.06] backdrop-blur-xl transform -rotate-12 translate-x-5 translate-y-2 opacity-35 shadow-2xl pointer-events-none" />
                <div className="absolute inset-0 rounded-3xl bg-[#111320]/55 border border-white/[0.1] backdrop-blur-xl transform -rotate-6 translate-x-2 translate-y-1 opacity-65 shadow-2xl pointer-events-none" />
                <div className="absolute inset-0 rounded-3xl bg-[#0f111c]/85 border-2 border-white/20 backdrop-blur-2xl p-7 flex flex-col items-center justify-center text-center shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(56,189,248,0.12)] hover:scale-[1.02] transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-5 shadow-inner">
                    <Lock size={22} strokeWidth={1.8} className="text-white" />
                  </div>
                  <h4 className="text-xs font-semibold tracking-[0.2em] text-white uppercase mb-2">MEMORY VAULT</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Your thoughts.<br />Your control.</p>
                </div>
              </div>

              {/* PIN floating card */}
              <div className="absolute bottom-0 right-0 sm:right-4 z-30 w-[230px] rounded-2xl bg-[#0a0a0f]/95 border border-white/20 p-4 backdrop-blur-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)]">
                <span className="text-xs font-medium text-zinc-300 block mb-3">
                  {pinSuccess ? "Vault Unlocked ✓" : "Enter your PIN"}
                </span>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <span
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          idx <= pinDots
                            ? pinSuccess
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                            : "bg-zinc-800 border border-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handlePinClick}
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-transform active:scale-90"
                  >
                    <ArrowRight size={13} strokeWidth={2.4} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.08] text-[10px] text-zinc-500">
                  <Lock size={10} />
                  <span>Your data. Your rules.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 05 — BUILDER NOTE ═══════════════════════ */}
      <section
        id="builder-note"
        className="relative min-h-screen flex items-center border-b border-white/[0.06] bg-[#050507]"
      >
        <div className="max-w-[1240px] mx-auto px-6 w-full py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Note text */}
            <div className="lg:col-span-6 text-left lg:pr-8 lg:border-r lg:border-white/[0.08] reveal-on-scroll">
              <span className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase block mb-5">
                BUILDER NOTE
              </span>
              <h2 className="text-[clamp(36px,4.5vw,58px)] font-bold tracking-tight leading-[1.07] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="text-white">A clearer</span><br />
                <span className="text-zinc-400 font-normal">tomorrow.</span>
              </h2>
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-6">
                Clarity is my way of giving back to the builder community — a space to think better, build faster, and stay grounded.
              </p>
              <div className="mb-10">
                <p className="text-sm font-medium text-white tracking-wide">— Shivam Kothekar</p>
                <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">FOUNDER, CLARITY</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-12">
                <a
                  href="https://github.com/ShivamSk07/Mindmate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-medium hover:bg-zinc-200 transition-all shadow-[0_2px_15px_rgba(255,255,255,0.15)] active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>View on GitHub</span>
                </a>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111116] border border-white/15 text-white text-[13px] font-medium hover:bg-[#181820] hover:border-white/25 transition-all active:scale-95"
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} className="text-zinc-400" />
                </Link>
              </div>

              <div className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase">
                —<br />SAME PEOPLE.<br />BOLDER IDEAS.
              </div>
            </div>

            {/* Right: Founder Photo */}
            <div className="lg:col-span-6 relative reveal-on-scroll">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-[0_20px_80px_rgba(0,0,0,0.9)] aspect-[4/3] group">
                <img
                  src="/img/builder-shivam.jpg"
                  alt="Shivam Kothekar — Founder, Clarity"
                  className="w-full h-full object-cover filter grayscale contrast-110 brightness-95 group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 z-10 text-left">
                  <span className="text-zinc-500 text-3xl font-serif leading-none block mb-1">"</span>
                  <blockquote className="font-serif text-xl text-white font-normal leading-snug">
                    "Better tools<br />create brighter days."
                  </blockquote>
                </div>
              </div>
              <div className="mt-4 text-right text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase">
                —<br />BUILT FOR<br />WHAT&apos;S NEXT.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ 06 — FOOTER ═══════════════════════ */}
      <footer id="footer-section" className="relative pt-24 pb-12 bg-[#030305] text-zinc-400 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.025)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-6 relative z-10">
          {/* Top Block: Newsletter + Monolith */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">

            {/* Left: Newsletter */}
            <div className="lg:col-span-6 text-left reveal-on-scroll">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-medium tracking-[0.25em] text-zinc-400 uppercase">STAY IN THE LOOP</span>
                <span className="w-6 h-[1px] bg-zinc-700" />
              </div>
              <h3 className="text-[clamp(32px,4vw,52px)] font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Build what&apos;s next,<br />
                <span className="text-zinc-400 font-normal">together.</span>
              </h3>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-md">
                Get product updates, new tools, and ideas from the Clarity builder community.
              </p>

              {/* Email Form */}
              <form onSubmit={handleSubscribe} className="relative max-w-md mb-6">
                <div className="rounded-full bg-[#0c0c12] border border-white/15 px-4 py-2.5 flex items-center justify-between gap-3 focus-within:border-white/30 transition-colors">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Mail size={14} className="text-zinc-500 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      required
                      className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-transform active:scale-90 flex-shrink-0"
                  >
                    <ArrowRight size={13} strokeWidth={2.4} />
                  </button>
                </div>
                {subscribed && (
                  <p className="absolute -bottom-6 left-4 text-xs text-emerald-400 font-medium">
                    ✓ Welcome to the Clarity community!
                  </p>
                )}
              </form>

              {/* Avatars */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border border-black bg-zinc-700 overflow-hidden">
                    <img src="/img/avatars.jpg" alt="Member" className="w-full h-full object-cover filter grayscale" />
                  </div>
                  <div className="w-7 h-7 rounded-full border border-black bg-zinc-600 overflow-hidden">
                    <img src="/img/builder-shivam.jpg" alt="Member" className="w-full h-full object-cover filter grayscale" />
                  </div>
                  <div className="w-7 h-7 rounded-full border border-black bg-zinc-800 flex items-center justify-center text-[10px] text-white font-medium">
                    +
                  </div>
                </div>
                <span className="text-xs text-zinc-400">Join a growing community</span>
              </div>
            </div>

            {/* Right: Architectural monolith */}
            <div className="lg:col-span-6 relative flex items-center justify-center reveal-on-scroll">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] w-full shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
                <img
                  src="/img/footer-monolith.jpg"
                  alt="Clarity Architecture Visual"
                  className="w-full h-full object-cover brightness-95"
                />
              </div>
              <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 text-right text-[9px] font-mono tracking-[0.25em] text-zinc-500 leading-loose">
                THINK<br />BUILD<br />REPEAT<br />—<br />A CLEARER<br />TOMORROW
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-white/[0.07] mb-10" />

          {/* Footer Nav */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex flex-wrap items-center gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2.5 pr-6 border-r border-white/10">
                <div className="w-7 h-7 relative flex-shrink-0">
                  <Image src="/img/logo.png" alt="Clarity" fill className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-white tracking-tight">Clarity</span>
              </div>

              {/* Links */}
              <div className="flex items-center gap-6 text-xs text-zinc-400">
                <Link href="#downloads" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText size={12} /><span>Product</span>
                </Link>
                <Link href="#cowork" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Users size={12} /><span>Community</span>
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen size={12} /><span>Docs</span>
                </Link>
                <Link href="/chat" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Zap size={12} /><span>Get Started</span>
                </Link>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 text-zinc-400">
              {[
                {
                  href: "https://github.com/ShivamSk07/Mindmate",
                  title: "GitHub",
                  svg: <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />,
                },
                {
                  href: "https://x.com",
                  title: "X (Twitter)",
                  svg: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
                },
                {
                  href: "https://linkedin.com",
                  title: "LinkedIn",
                  svg: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.738-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />,
                },
                {
                  href: "https://youtube.com",
                  title: "YouTube",
                  svg: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
                },
              ].map(({ href, title, svg }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors p-1"
                  title={title}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    {svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 pt-6 border-t border-white/[0.05]">
            <p>© 2026 Clarity. All rights reserved.</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase mt-2 sm:mt-0">
              BUILT FOR BOLDER IDEAS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
