"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Briefcase, 
  Github, 
  Database, 
  Figma, 
  FileText, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Code2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CoworkPage() {
  const router = useRouter();

  // Active Integration Tab & Inputs
  const [selectedIntegration, setSelectedIntegration] = useState<"github" | "postgresql" | "figma" | "notion" | "all">("github");
  const [githubRepo, setGithubRepo] = useState("ShivamSk07/Mindmate");
  const [githubBranch, setGithubBranch] = useState("main");
  const [postgresUri, setPostgresUri] = useState("postgresql://neondb_owner:***@ep-silent-math...neondb");
  const [figmaUrl, setFigmaUrl] = useState("https://figma.com/file/Clarity-Apple-UI-Tokens");
  const [notionUrl, setNotionUrl] = useState("https://notion.so/clarity/architecture-spec");

  // Agent State
  const [taskPrompt, setTaskPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [agentReport, setAgentReport] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);

  const handleRunAgentTask = async (customPrompt?: string) => {
    const promptToRun = customPrompt || taskPrompt;
    if (!promptToRun.trim() || isRunning) return;

    setIsRunning(true);
    setError(null);

    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initializing Clarity CoWork Agentic Session...`,
      `[${new Date().toLocaleTimeString()}] 🔌 Binding tool integration context: ${selectedIntegration.toUpperCase()}`,
    ]);

    try {
      const response = await fetch("/api/cowork/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: selectedIntegration,
          targetRepo: githubRepo,
          taskPrompt: promptToRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Agentic workflow execution failed");
      }

      setExecutionLogs(data.logs || []);
      setAgentReport(data.report || "Task completed cleanly.");

    } catch (err: any) {
      setError(err.message || "An error occurred during agent execution");
      setExecutionLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyReport = () => {
    if (!agentReport) return;
    navigator.clipboard.writeText(agentReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const PRESET_WORKFLOWS = [
    {
      id: "audit-codebase",
      title: "Audit GitHub Codebase for Security & Bugs",
      integration: "github" as const,
      icon: Github,
      prompt: "Analyze our connected GitHub repository (ShivamSk07/Mindmate), audit source files for security vulnerabilities, secret leaks, memory leaks, and generate code refactoring recommendations.",
    },
    {
      id: "optimize-db",
      title: "Optimize PostgreSQL Schema & Database Queries",
      integration: "postgresql" as const,
      icon: Database,
      prompt: "Inspect our PostgreSQL schema (User, Session, Message, UserProfile, Task). Audit table indexing, query performance, and write optimized queries.",
    },
    {
      id: "figma-components",
      title: "Extract Figma UI Tokens & Build React Components",
      integration: "figma" as const,
      icon: Figma,
      prompt: "Inspect connected Figma design tokens (#000000 main, #1c1c1e cards, #2c2c2e borders) and generate clean, production-ready React Tailwind UI components.",
    },
    {
      id: "notion-architecture",
      title: "Sync Notion Docs & Build System Architecture",
      integration: "notion" as const,
      icon: FileText,
      prompt: "Sync connected Notion workspace specifications and generate a comprehensive technical system architecture document for our AI companion codebase.",
    },
  ];

  return (
    <div className="h-[100dvh] w-full bg-[#000000] text-[#f2f2f7] flex overflow-hidden font-sans">
      
      {/* ── LEFT SIDEBAR: INTEGRATIONS & TOOL BINDINGS ── */}
      <aside className="w-[300px] bg-[#111113] border-r border-[#222226] flex flex-col h-full flex-shrink-0">
        
        {/* Header Branding */}
        <div className="px-5 h-14 border-b border-[#222226] flex items-center justify-between flex-shrink-0">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex items-center justify-center p-1 shadow-sm">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Clarity CoWork</span>
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e] transition-all border border-[#2c2c2e]"
            title="Back to Chat"
          >
            <ArrowLeft size={13} />
            <span>Chat</span>
          </Link>
        </div>

        {/* Integrations Configuration Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
              Connected Tool Integrations
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Integration 1: GitHub */}
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Github size={15} className="text-[#a1a1aa]" />
                <span>GitHub Repository</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="owner/repo"
                className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-lg px-2.5 py-1.5 text-xs text-[#f2f2f7] outline-none font-mono"
              />
              <input
                type="text"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                placeholder="branch (main)"
                className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-lg px-2.5 py-1.5 text-xs text-[#8e8e93] outline-none font-mono"
              />
            </div>
          </div>

          {/* Integration 2: PostgreSQL */}
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Database size={15} className="text-[#a1a1aa]" />
                <span>PostgreSQL DB</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <input
              type="password"
              value={postgresUri}
              onChange={(e) => setPostgresUri(e.target.value)}
              className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-lg px-2.5 py-1.5 text-xs text-[#8e8e93] outline-none font-mono"
            />
          </div>

          {/* Integration 3: Figma */}
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Figma size={15} className="text-[#a1a1aa]" />
                <span>Figma UI Tokens</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
            </div>
            <input
              type="text"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-lg px-2.5 py-1.5 text-xs text-[#8e8e93] outline-none"
            />
          </div>

          {/* Integration 4: Notion */}
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileText size={15} className="text-[#a1a1aa]" />
                <span>Notion Docs</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
            </div>
            <input
              type="text"
              value={notionUrl}
              onChange={(e) => setNotionUrl(e.target.value)}
              className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-lg px-2.5 py-1.5 text-xs text-[#8e8e93] outline-none"
            />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#222226] bg-[#111113] text-[11px] text-[#8e8e93]">
          Clarity CoWork Agent Core • v2.4
        </div>
      </aside>

      {/* ── MAIN WORKSPACE AREA (CENTER COLUMN) ── */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#000000] relative">
        
        {/* Workspace Toolbar Header */}
        <header className="h-14 px-6 bg-[#111113]/90 backdrop-blur-md border-b border-[#222226] flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-white">
              <Briefcase size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">Agentic Workspace</h1>
              <p className="text-[10px] text-[#8e8e93]">Execute autonomous tasks across connected integrations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                showTerminal
                  ? "bg-[#1c1c1e] text-white border-[#2c2c2e]"
                  : "bg-transparent text-[#8e8e93] border-transparent hover:text-white"
              }`}
            >
              <Terminal size={14} />
              <span>Terminal Logs</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Workspace Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Target Integration Selection Strip */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">
                Select Active Tool Context
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "github", label: "GitHub Repo", icon: Github, sub: githubRepo },
                  { id: "postgresql", label: "PostgreSQL DB", icon: Database, sub: "Prisma ORM" },
                  { id: "figma", label: "Figma UI Tokens", icon: Figma, sub: "Dark Specs" },
                  { id: "notion", label: "Notion Docs", icon: FileText, sub: "Workspace Specs" },
                  { id: "all", label: "All Integrations", icon: Layers, sub: "Full Suite" },
                ].map((item) => {
                  const IconC = item.icon;
                  const isSel = selectedIntegration === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIntegration(item.id as any)}
                      className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                        isSel
                          ? "bg-[#1c1c1e] border-white text-white shadow-sm"
                          : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <IconC size={14} className={isSel ? "text-white" : "text-[#8e8e93]"} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-[#8e8e93] truncate">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task Console Input Card */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <Sparkles size={14} className="text-white" />
                  Agentic Task Instructions
                </label>
                <span className="text-[10px] font-mono text-[#8e8e93]">
                  Autonomous Agent Engine
                </span>
              </div>

              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                placeholder={`Describe what you want the agent to do with ${selectedIntegration.toUpperCase()}... e.g. Audit codebase for security bugs and refactor code.`}
                rows={3}
                className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl p-3.5 text-xs text-[#f2f2f7] placeholder-[#8e8e93] outline-none resize-none leading-relaxed transition-all"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#8e8e93]">
                  Active Context: <strong className="text-white capitalize">{selectedIntegration}</strong>
                </span>

                <button
                  onClick={() => handleRunAgentTask()}
                  disabled={!taskPrompt.trim() || isRunning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-[#e5e5ea] disabled:bg-[#2c2c2e] disabled:text-[#6c6c70] disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm flex-shrink-0"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Executing Task...</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      <span>Run Agent Workflow</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preset Workflows Grid */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">
                Preset Agentic Workflows
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_WORKFLOWS.map((w) => {
                  const IconComponent = w.icon;
                  return (
                    <div
                      key={w.id}
                      onClick={() => {
                        setSelectedIntegration(w.integration);
                        setTaskPrompt(w.prompt);
                        handleRunAgentTask(w.prompt);
                      }}
                      className="bg-[#111113] hover:bg-[#1c1c1e] border border-[#222226] hover:border-[#2c2c2e] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-sm min-h-[96px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-white group-hover:scale-105 transition-transform">
                            <IconComponent size={15} />
                          </div>
                          <span className="text-xs font-semibold text-white">
                            {w.title}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-[#8e8e93] group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-[11px] text-[#8e8e93] line-clamp-2 mt-2">
                        {w.prompt}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Terminal Logs Panel */}
            {showTerminal && executionLogs.length > 0 && (
              <div className="bg-[#111113] border border-[#2c2c2e] rounded-2xl p-4 space-y-2 shadow-inner">
                <div className="flex items-center justify-between border-b border-[#222226] pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#8e8e93] flex items-center gap-1.5">
                    <Terminal size={12} /> Execution Logs ({executionLogs.length} steps)
                  </span>
                  <button
                    onClick={() => setExecutionLogs([])}
                    className="text-[10px] text-[#8e8e93] hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="font-mono text-xs text-[#a1a1aa] space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                  {executionLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Output Report Display */}
            {agentReport && (
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Agent Task Output</h3>
                  </div>
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
                  >
                    {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedReport ? "Copied" : "Copy Output"}</span>
                  </button>
                </div>

                <div className="text-xs leading-relaxed text-[#f2f2f7] font-sans overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-bold my-3 text-white">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-semibold my-2.5 text-white border-b border-[#2c2c2e] pb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-semibold my-2 text-white">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-[#d1d1d6]">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-[#d1d1d6]">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-[#d1d1d6]">{children}</ol>,
                      code: ({ children, ...props }) => (
                        <code className="bg-[#111113] border border-[#2c2c2e] rounded px-1.5 py-0.5 text-xs font-mono text-white" {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono text-[#f2f2f7]">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {agentReport}
                  </ReactMarkdown>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

    </div>
  );
}
