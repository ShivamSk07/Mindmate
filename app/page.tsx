import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import {
  Sparkles,
  Github,
  HardDrive,
  Calendar,
  Mail,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  Bot,
  Zap,
  Lock,
  Workflow,
  Code2,
} from "lucide-react";

export const metadata = {
  title: "Clarity — Autonomous AI Agentic Workspace",
  description:
    "Clarity is an autonomous AI agentic workspace that connects your GitHub, Google Drive, Gmail, Calendar, and Sheets to execute multi-tool workflows and automate enterprise tasks.",
};

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#070709] text-[#f2f2f7] flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── Top Navigation ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#1c1c1e] bg-[#0c0c0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/img/branding.png"
              alt="Clarity Logo"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
            >
              Terms of Service
            </Link>
            {user ? (
              <Link
                href="/cowork"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>Open Workspace</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-[#2c2c2e] hover:bg-[#1c1c1e] text-xs font-medium text-zinc-300 transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-[#1c1c1e]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles size={12} />
            <span>Autonomous AI Agentic Workspace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Supercharge Developer Workflows with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Clarity</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Clarity connects directly to your <strong>GitHub repositories</strong> and <strong>Google Workspace</strong> (Gmail, Google Drive, Calendar, and Sheets) to autonomously plan, code, inspect architecture, and orchestrate cross-platform productivity workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/cowork" : "/signup"}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>Launch Clarity Cowork</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#2c2c2e] hover:bg-[#141419] text-sm font-medium text-zinc-300 transition-all"
            >
              <ShieldCheck size={16} className="text-indigo-400" />
              <span>Read Privacy Policy</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Purpose & Core Capabilities ──────────────────────────────── */}
      <section className="py-20 border-b border-[#1c1c1e] bg-[#09090c]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              What is Clarity and What is Its Purpose?
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Clarity is an enterprise-ready intelligent assistant designed to bridge codebases, documents, schedules, and communication channels into one unified autonomous co-pilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#111115] border border-[#222228] flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Code2 size={20} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">GitHub Codebase Analysis</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect GitHub repositories to automatically index code, review pull requests, create visual architecture diagrams, and generate surgical bug fixes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#111115] border border-[#222228] flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Workflow size={20} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Google Workspace Sync</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seamlessly read Google Drive documents, inspect upcoming Google Calendar free time slots, draft Gmail messages, and export sprint data into Google Sheets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#111115] border border-[#222228] flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Bot size={20} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Autonomous Multi-Step Planning</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Break high-level user goals into structured multi-step execution plans with live reasoning, human-in-the-loop approvals, and interactive visual artifacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Google Workspace Integration Disclosure ──────────────────── */}
      <section className="py-16 border-b border-[#1c1c1e]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 rounded-2xl bg-[#101015] border border-[#272732]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Google Workspace Integration & Security Standards</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-6">
              Clarity strictly complies with the <strong>Google API Services User Data Policy</strong>, including Limited Use requirements. When you authorize Google Workspace connections in Clarity, we request only read-only access to deliver requested assistant features:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#15151c] border border-[#252530]">
                <Mail size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block mb-0.5">Gmail (Read-Only)</strong>
                  <span>Allows Clarity to search relevant communication threads for project context.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#15151c] border border-[#252530]">
                <HardDrive size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block mb-0.5">Google Drive (Read-Only)</strong>
                  <span>Allows the agent to reference project documentation and requirements.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#15151c] border border-[#252530]">
                <Calendar size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block mb-0.5">Google Calendar (Read-Only)</strong>
                  <span>Enables intelligent meeting schedule checks and focus time planning.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#15151c] border border-[#252530]">
                <FileSpreadsheet size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block mb-0.5">Google Sheets (Read-Only)</strong>
                  <span>Used to extract structured data for task metrics and sprint reporting.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#22222c] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Your data is never sold, transferred, or used for training AI models.</span>
              <Link href="/privacy" className="text-indigo-400 hover:underline">
                View Full Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-8 bg-[#09090c] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/img/branding.png"
              alt="Clarity"
              className="h-6 w-auto object-contain brightness-0 invert opacity-80"
            />
            <span>— Autonomous AI Agentic Workspace</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cowork" className="hover:text-zinc-300 transition-colors">
              CoWork
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
