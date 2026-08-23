"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Briefcase, 
  Github, 
  Database, 
  Figma, 
  FileText, 
  Send, 
  Terminal, 
  CheckCircle2, 
  Play, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  Layers,
  ShieldCheck,
  Code2,
  RefreshCw,
  Download,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidViewer, { isDiagramCode } from "./MermaidViewer";

interface CoworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function MermaidToSvgModal({ code }: { code: string }) {
  return <MermaidViewer code={code} />;
}

export function CoworkModal({ isOpen, onClose }: CoworkModalProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "integrations" | "logs">("workspace");
  
  // Integration States
  const [githubRepo, setGithubRepo] = useState("ShivamSk07/Mindmate");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubConnected, setGithubConnected] = useState(true);

  const [postgresUri, setPostgresUri] = useState("postgresql://neondb_owner:***@ep-silent-math...neondb");
  const [postgresConnected, setPostgresConnected] = useState(true);

  const [notionPage, setNotionPage] = useState("https://notion.so/clarity/architecture-spec");
  const [notionConnected, setNotionConnected] = useState(false);

  const [figmaFile, setFigmaFile] = useState("https://figma.com/file/Clarity-Apple-UI-Tokens");
  const [figmaConnected, setFigmaConnected] = useState(false);

  // Agent Execution States
  const [selectedIntegration, setSelectedIntegration] = useState<"github" | "postgresql" | "notion" | "figma" | "general">("github");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [agentReport, setAgentReport] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAgentTask = async (customPrompt?: string) => {
    const promptToRun = customPrompt || taskPrompt;
    if (!promptToRun.trim() || isRunning) return;

    setIsRunning(true);
    setError(null);
    setAgentReport(null);
    setActiveTab("workspace");

    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initializing Clarity Autonomous CoWork Agent...`,
      `[${new Date().toLocaleTimeString()}] 🔌 Binding active tool integration (${selectedIntegration.toUpperCase()})...`,
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
        throw new Error(data.error || "Agentic execution failed");
      }

      setExecutionLogs(data.logs || []);
      setAgentReport(data.report || "Task completed cleanly.");

    } catch (err: any) {
      setError(err.message || "An error occurred during agent task execution");
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

  const PRESET_TASKS = [
    {
      id: "audit-github",
      label: "Audit GitHub Codebase for Bugs & Vulnerabilities",
      integration: "github" as const,
      icon: Github,
      prompt: "Analyze our connected GitHub repository (ShivamSk07/Mindmate), audit all source files for security vulnerabilities, API key leaks, and code optimization recommendations.",
    },
    {
      id: "db-schema",
      label: "Audit Database Schema & Write Query Optimizations",
      integration: "postgresql" as const,
      icon: Database,
      prompt: "Inspect our PostgreSQL database schema (User, Session, Message, UserProfile, Task). Audit indexing strategies, check foreign key constraints, and write optimized queries.",
    },
    {
      id: "figma-tokens",
      label: "Extract Design Tokens & Generate React Components",
      integration: "figma" as const,
      icon: Figma,
      prompt: "Inspect connected Figma design tokens (#000000 main, #1c1c1e cards, #2c2c2e borders, #007aff accent) and generate clean, production-ready React Tailwind UI components.",
    },
    {
      id: "notion-spec",
      label: "Sync Documentation & Build Architecture Spec",
      integration: "notion" as const,
      icon: FileText,
      prompt: "Sync our connected Notion workspace docs and generate a complete technical system architecture document for our AI companion project.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fade-in">
      
      {/* Modal Container — Apple Dark Aesthetics */}
      <div className="w-full max-w-5xl h-[90dvh] bg-[#000000] border border-[#2c2c2e] rounded-[24px] shadow-2xl flex flex-col overflow-hidden text-[#f2f2f7]">
        
        {/* Header Bar */}
        <div className="h-16 px-6 bg-[#111113] border-b border-[#222226] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex items-center justify-center p-1.5 shadow-sm">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">Clarity CoWork</h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#007aff]/15 text-[#0a84ff] rounded-full border border-[#007aff]/30">
                  AGENTIC WORKSPACE
                </span>
              </div>
              <p className="text-[11px] text-[#8e8e93]">
                Connect your tools & run autonomous AI agent workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white flex items-center justify-center transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-[#111113]/60 border-b border-[#222226] flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "workspace"
                ? "bg-[#1c1c1e] text-white border border-[#2c2c2e] shadow-sm"
                : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
            }`}
          >
            <Sparkles size={14} className={activeTab === "workspace" ? "text-[#0a84ff]" : ""} />
            <span>Agent Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "integrations"
                ? "bg-[#1c1c1e] text-white border border-[#2c2c2e] shadow-sm"
                : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
            }`}
          >
            <Layers size={14} className={activeTab === "integrations" ? "text-[#0a84ff]" : ""} />
            <span>Integrations Suite</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "logs"
                ? "bg-[#1c1c1e] text-white border border-[#2c2c2e] shadow-sm"
                : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
            }`}
          >
            <Terminal size={14} className={activeTab === "logs" ? "text-[#0a84ff]" : ""} />
            <span>Terminal & Logs</span>
            {executionLogs.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-[#2c2c2e] text-[#a1a1aa] rounded-full">
                {executionLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[#000000]">
          
          {/* TAB 1: AGENT WORKSPACE */}
          {activeTab === "workspace" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Integration Selector Strip */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">
                  Target Integration Context
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setSelectedIntegration("github")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedIntegration === "github"
                        ? "bg-[#1c1c1e] border-[#007aff] text-white shadow-md"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                    }`}
                  >
                    <Github size={16} className="text-[#0a84ff]" />
                    <div>
                      <div className="text-xs font-semibold">GitHub Repo</div>
                      <div className="text-[10px] text-[#8e8e93] truncate">{githubRepo}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedIntegration("postgresql")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedIntegration === "postgresql"
                        ? "bg-[#1c1c1e] border-[#007aff] text-white shadow-md"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                    }`}
                  >
                    <Database size={16} className="text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold">PostgreSQL DB</div>
                      <div className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded w-max">Active</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedIntegration("figma")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedIntegration === "figma"
                        ? "bg-[#1c1c1e] border-[#007aff] text-white shadow-md"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                    }`}
                  >
                    <Figma size={16} className="text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold">Figma Tokens</div>
                      <div className="text-[10px] text-[#8e8e93]">Dark UI Specs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedIntegration("notion")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedIntegration === "notion"
                        ? "bg-[#1c1c1e] border-[#007aff] text-white shadow-md"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                    }`}
                  >
                    <FileText size={16} className="text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Notion Docs</div>
                      <div className="text-[10px] text-[#8e8e93]">Workspace Specs</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Agent Task Input Box */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                    <Sparkles size={13} className="text-[#0a84ff]" />
                    Describe Agentic Task To Execute
                  </label>
                  <span className="text-[10px] font-mono text-[#8e8e93]">
                    Powered by Clarity AI Core
                  </span>
                </div>

                <textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder={`Example: Audit ${githubRepo} for security vulnerabilities, memory leaks, and generate optimized code diffs...`}
                  rows={3}
                  className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl p-3 text-xs text-[#f2f2f7] placeholder-[#636366] outline-none resize-none leading-relaxed transition-all"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8e8e93]">
                    Context: <strong className="text-white capitalize">{selectedIntegration} Integration</strong>
                  </span>

                  <button
                    onClick={() => handleRunAgentTask()}
                    disabled={!taskPrompt.trim() || isRunning}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-[#e5e5ea] disabled:bg-[#2c2c2e] disabled:text-[#6c6c70] active:scale-95 transition-all shadow-sm flex-shrink-0"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Running Agent...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="currentColor" />
                        <span>Execute Agent Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preset Action Quick Launcher */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">
                  Preset Agent Workflows
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRESET_TASKS.map((preset) => {
                    const IconComp = preset.icon;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setSelectedIntegration(preset.integration);
                          setTaskPrompt(preset.prompt);
                          handleRunAgentTask(preset.prompt);
                        }}
                        className="bg-[#111113] hover:bg-[#1c1c1e] border border-[#222226] hover:border-[#2c2c2e] rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-sm min-h-[100px]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] text-[#0a84ff] group-hover:scale-105 transition-transform">
                              <IconComp size={15} />
                            </div>
                            <span className="text-xs font-semibold text-white group-hover:text-[#0a84ff] transition-colors">
                              {preset.label}
                            </span>
                          </div>
                          <Sparkles size={13} className="text-[#636366] group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[11px] text-[#8e8e93] line-clamp-2 mt-2">
                          {preset.prompt}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                  {error}
                </div>
              )}

              {/* Output Report Display Card */}
              {agentReport && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-semibold text-white">Agent Execution Results</h3>
                    </div>
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
                    >
                      {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedReport ? "Copied" : "Copy Report"}</span>
                    </button>
                  </div>

                  <div className="text-xs leading-relaxed text-[#e5e5ea] font-sans overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold my-3 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold my-2.5 text-[#0a84ff] border-b border-[#2c2c2e] pb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold my-2 text-white">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 leading-relaxed text-[#d1d1d6]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-[#d1d1d6]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-[#d1d1d6]">{children}</ol>,
                        code: ({ children, className, ...props }: any) => {
                          const codeString = String(children || "").trim();
                          const isDiagram = isDiagramCode(className, codeString);

                          if (!props.inline && isDiagram) {
                            return <MermaidToSvgModal code={codeString} />;
                          }

                          return props.inline ? (
                            <code className="bg-[#111113] border border-[#2c2c2e] rounded px-1.5 py-0.5 text-xs font-mono text-[#0a84ff]">
                              {children}
                            </code>
                          ) : (
                            <code className="text-xs font-mono text-[#f2f2f7]">{children}</code>
                          );
                        },
                        pre: ({ children }: any) => {
                          const childCode = String(children?.props?.children || "").trim();
                          const childClass = children?.props?.className || "";
                          if (isDiagramCode(childClass, childCode)) {
                            return <>{children}</>;
                          }
                          return (
                            <pre className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono text-[#f2f2f7]">
                              {children}
                            </pre>
                          );
                        },
                        a: ({ children, href }) => {
                          if (href?.startsWith("https://kroki.io/")) {
                            return (
                              <div className="my-3 p-2 bg-[#111113] border border-[#2c2c2e] rounded-xl overflow-hidden flex flex-col items-center gap-1.5 select-none">
                                <img src={href} alt="Rendered Diagram" className="max-w-full max-h-[300px] object-contain" />
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#0a84ff] hover:underline">
                                  Open in new tab
                                </a>
                              </div>
                            );
                          }
                          return (
                            <a href={href} target="_blank" rel="noopener" className="text-[#0a84ff] hover:underline transition-colors">
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {agentReport}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: INTEGRATIONS SUITE */}
          {activeTab === "integrations" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Integrations Suite</h3>
                <p className="text-xs text-[#8e8e93]">
                  Connect your development tools & cloud services to empower Clarity CoWork Agent.
                </p>
              </div>

              {/* Integration 1: GitHub */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2c2c2e] flex items-center justify-center text-white">
                      <Github size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">GitHub Repository</h4>
                      <p className="text-[11px] text-[#8e8e93]">Analyze source code, audit PRs, and generate documentation.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                      Repository (owner/repo)
                    </label>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Integration 2: PostgreSQL Database */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2c2c2e] flex items-center justify-center text-emerald-400">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">PostgreSQL Database</h4>
                      <p className="text-[11px] text-[#8e8e93]">Schema inspection, query optimization, and index auditing.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active (Prisma ORM)
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                    Database URI
                  </label>
                  <input
                    type="password"
                    value={postgresUri}
                    onChange={(e) => setPostgresUri(e.target.value)}
                    className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Integration 3: Figma */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2c2c2e] flex items-center justify-center text-purple-400">
                      <Figma size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Figma Design Tokens</h4>
                      <p className="text-[11px] text-[#8e8e93]">Extract design tokens, color styles, and generate React code.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFigmaConnected(!figmaConnected)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      figmaConnected
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#2c2c2e] text-white border-[#3a3a3c] hover:bg-[#3a3a3c]"
                    }`}
                  >
                    {figmaConnected ? "Connected" : "Connect Figma"}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                    Figma File URL / Key
                  </label>
                  <input
                    type="text"
                    value={figmaFile}
                    onChange={(e) => setFigmaFile(e.target.value)}
                    className="w-full bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TERMINAL LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Agent Execution Logs</h3>
                  <p className="text-xs text-[#8e8e93]">Real-time autonomous agent reasoning trajectory</p>
                </div>
                <button
                  onClick={() => setExecutionLogs([])}
                  className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] text-xs font-medium text-[#8e8e93] hover:text-white transition-all"
                >
                  Clear Logs
                </button>
              </div>

              <div className="bg-[#111113] border border-[#2c2c2e] rounded-2xl p-4 font-mono text-xs text-[#0a84ff] space-y-2 min-h-[350px] max-h-[480px] overflow-y-auto scrollbar-thin shadow-inner">
                {executionLogs.length === 0 ? (
                  <div className="text-center py-20 text-[#636366]">
                    No agent logs recorded yet. Execute a task in the Agent Workspace tab to view logs.
                  </div>
                ) : (
                  executionLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed border-b border-[#222226]/50 pb-1.5 last:border-none">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="h-14 px-6 bg-[#111113] border-t border-[#222226] flex items-center justify-between text-xs text-[#8e8e93] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Agent Engine Status: <strong className="text-white font-medium">Ready</strong></span>
          </div>
          <div>
            Clarity Agentic Architecture v2.4
          </div>
        </div>

      </div>
    </div>
  );
}
