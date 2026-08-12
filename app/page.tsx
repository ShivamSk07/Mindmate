import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Clarity — Autonomous AI Agentic Workspace",
  description:
    "Clarity is an autonomous AI agentic workspace that connects your GitHub, Google Drive, Gmail, Calendar, and Sheets to execute multi-tool workflows, audit codebases, and automate enterprise tasks.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-lg">
            C
          </div>
          <span className="text-xl font-bold text-white">Clarity</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Autonomous AI Agentic Workspace
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Clarity
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 text-3xl md:text-4xl mt-2 font-medium">
            Your AI Work Intelligence Layer
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Clarity connects your <strong className="text-white">GitHub repositories</strong>,{" "}
          <strong className="text-white">Gmail</strong>,{" "}
          <strong className="text-white">Google Drive</strong>,{" "}
          <strong className="text-white">Calendar</strong>, and{" "}
          <strong className="text-white">Sheets</strong> to autonomously execute complex
          multi-tool workflows, audit codebases, and automate enterprise tasks — all from a
          single AI workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/25"
          >
            Start for Free →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🤖",
              title: "Autonomous AI Agent",
              desc: "CoWork agent autonomously executes multi-step tasks across all your connected tools without manual intervention.",
            },
            {
              icon: "🔗",
              title: "Unified Integrations",
              desc: "Seamlessly connect GitHub, Gmail, Google Drive, Calendar, and Sheets in one intelligent workspace.",
            },
            {
              icon: "🔒",
              title: "Secure & Private",
              desc: "Your data stays yours. All OAuth tokens are encrypted and your Google data is never shared with third parties.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/30 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/10 flex items-center justify-between text-gray-500 text-sm">
        <span>© 2026 Clarity AI Workspace</span>
        <Link href="/privacy" className="text-violet-400 hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
