"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Github,
  HardDrive,
  Calendar,
  Mail,
  FileSpreadsheet,
  Plug,
  Globe,
  GitBranch,
  GitPullRequest,
  AlertCircle,
  FileCode2,
  FolderTree,
  FileText,
  Play,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Plus,
  Layers,
  Code2,
  Sliders,
  UserCheck,
  Send
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  username?: string | null;
  details?: string;
}

interface PlanStep {
  id: string;
  title: string;
  status: "completed" | "running" | "waiting" | "approval_required" | "failed";
}

interface ActivityItem {
  id: string;
  timestamp: string;
  type: "connect" | "tool_call" | "reasoning" | "approval_request" | "success" | "error";
  category?: "github" | "drive" | "calendar" | "gmail" | "sheets" | "mcp" | "browser" | "system";
  title: string;
  description: string;
  toolName?: string;
  query?: string;
  details?: any;
}

interface PendingApproval {
  toolName: string;
  category: "github" | "drive" | "calendar" | "gmail" | "sheets" | "mcp" | "browser";
  params: any;
  title: string;
  description: string;
  targetResource: string;
}

interface Artifact {
  id: string;
  title: string;
  type: "report" | "plan" | "email" | "calendar" | "sheets" | "code_diff" | "review";
  content: string;
  createdAt: string;
}

interface CoworkTask {
  id: string;
  userQuery: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  status: "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  usedTools: string[];
  plan: PlanStep[];
  activityFeed: ActivityItem[];
  pendingApproval: PendingApproval | null;
  report: string | null;
  codeDiff: string | null;
  scores: {
    overall: number;
    security: number;
    architecture: number;
    codeQuality: number;
    maintenance: number;
  } | null;
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
}

export default function CoworkPage() {
  const router = useRouter();

  // Integrations State
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [activeToolsCount, setActiveToolsCount] = useState(7);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showAddMCPModal, setShowAddMCPModal] = useState(false);
  const [mcpServerName, setMcpServerName] = useState("");
  const [mcpServerUrl, setMcpServerUrl] = useState("");

  // Workspace Nav State (Left Sidebar)
  const [workspaceNav, setWorkspaceNav] = useState<"overview" | "tasks" | "files" | "artifacts">("overview");

  // Task & Execution State
  const [recentTasks, setRecentTasks] = useState<CoworkTask[]>([]);
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Artifact State
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchIntegrationsStatus();
    fetchTaskHistory();
  }, []);

  const fetchIntegrationsStatus = async () => {
    try {
      const res = await fetch("/api/cowork/status");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
        setActiveToolsCount(data.activeToolsCount || 7);
      }
    } catch (e) {
      console.error("Failed to fetch integrations status", e);
    }
  };

  const fetchTaskHistory = async () => {
    try {
      const res = await fetch("/api/cowork/history");
      if (res.ok) {
        const data = await res.json();
        setRecentTasks(data.tasks || []);
      }
    } catch (e) {
      console.error("Failed to fetch task history", e);
    }
  };

  // 2. Task Polling Effect
  useEffect(() => {
    if (currentTask && (currentTask.status === "running" || currentTask.status === "waiting_approval")) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/cowork/tasks/${currentTask.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.task) {
              setCurrentTask(data.task);
              if (data.task.artifacts?.length > 0 && !activeArtifact) {
                setActiveArtifact(data.task.artifacts[0]);
              }
              if (["completed", "failed", "cancelled"].includes(data.task.status)) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                fetchTaskHistory();
              }
            }
          }
        } catch (e) {
          console.error("Task polling error", e);
        }
      }, 1000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentTask?.id, currentTask?.status, activeArtifact]);

  // 3. Start Agentic Goal Task
  const handleStartTask = async (customPrompt?: string) => {
    const promptToUse = customPrompt || promptInput;
    if (!promptToUse.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setActiveArtifact(null);

    try {
      const res = await fetch("/api/cowork/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          repoName: "ShivamSk07/Mindmate",
          branch: "main",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start task");

      setCurrentTask(data.task);
      setPromptInput("");

    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectIntegration = async (id: string) => {
    if (id === "github") {
      await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
    } else if (["drive", "calendar", "gmail", "sheets"].includes(id)) {
      await fetch("/api/cowork/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
    }
    fetchIntegrationsStatus();
  };

  const handleDisconnectIntegration = async (id: string) => {
    if (id === "github") {
      await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    } else if (["drive", "calendar", "gmail", "sheets"].includes(id)) {
      await fetch("/api/cowork/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    }
    fetchIntegrationsStatus();
  };

  // 4. Universal Approval Handlers
  const handleApproveAction = async () => {
    if (!currentTask) return;
    try {
      const res = await fetch(`/api/cowork/tasks/${currentTask.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setCurrentTask(data.task);
      }
    } catch (e) {
      console.error("Approval error", e);
    }
  };

  const handleCancelAction = async () => {
    if (!currentTask) return;
    try {
      const res = await fetch(`/api/cowork/tasks/${currentTask.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setCurrentTask(data.task);
      }
    } catch (e) {
      console.error("Cancellation error", e);
    }
  };

  const handleAddMCPServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpServerName.trim() || !mcpServerUrl.trim()) return;

    try {
      const res = await fetch("/api/cowork/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mcpServerName, url: mcpServerUrl }),
      });
      if (res.ok) {
        setMcpServerName("");
        setMcpServerUrl("");
        setShowAddMCPModal(false);
        fetchIntegrationsStatus();
      }
    } catch (e) {
      console.error("MCP registration error", e);
    }
  };

  const MULTI_TOOL_PROMPTS = [
    "Compare Drive proposal with Mindmate GitHub code",
    "Audit my GitHub codebase for launch",
    "Check tomorrow's calendar & draft email reply",
    "Analyze sales dataset in Google Sheets",
    "Search web documentation via Browser Agent",
  ];

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case "github": return <Github size={14} className="text-white flex-shrink-0" />;
      case "drive": return <HardDrive size={14} className="text-white flex-shrink-0" />;
      case "calendar": return <Calendar size={14} className="text-white flex-shrink-0" />;
      case "gmail": return <Mail size={14} className="text-white flex-shrink-0" />;
      case "sheets": return <FileSpreadsheet size={14} className="text-white flex-shrink-0" />;
      case "mcp": return <Plug size={14} className="text-white flex-shrink-0" />;
      case "browser": return <Globe size={14} className="text-white flex-shrink-0" />;
      default: return <Sparkles size={14} className="text-white flex-shrink-0" />;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#000000] text-[#f2f2f7] flex flex-col overflow-hidden font-sans">
      
      {/* ── HEADER BAR ── */}
      <header className="h-14 px-5 bg-[#111113] border-b border-[#222226] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex items-center justify-center p-1 shadow-sm">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Clarity CoWork</span>
          </Link>
          <span className="text-xs text-[#636366]">/</span>
          <span className="text-xs font-mono text-[#8e8e93]">Unified Agentic Workspace</span>
        </div>

        {/* Tools Available Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] hover:bg-[#2c2c2e] text-xs transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-medium">● {activeToolsCount} Tools Available</span>
            <span className="text-[#8e8e93] text-[11px] font-mono underline ml-1">Manage</span>
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:bg-[#2c2c2e] text-xs font-medium text-[#8e8e93] hover:text-white transition-all"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* ── 3-COLUMN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── COLUMN 1: LEFT SIDEBAR (WORKSPACE & INTEGRATIONS) ── */}
        <aside className="w-[280px] bg-[#111113] border-r border-[#222226] flex flex-col h-full flex-shrink-0">
          
          {/* Workspace Sections */}
          <div className="p-4 border-b border-[#222226] space-y-1">
            <span className="block px-2 text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93] mb-1">
              Workspace
            </span>

            <button
              onClick={() => setWorkspaceNav("overview")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                workspaceNav === "overview"
                  ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                  : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
              }`}
            >
              <Briefcase size={14} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setWorkspaceNav("tasks")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                workspaceNav === "tasks"
                  ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                  : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Recent Tasks ({recentTasks.length})</span>
            </button>

            <button
              onClick={() => setWorkspaceNav("artifacts")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                workspaceNav === "artifacts"
                  ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                  : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
              }`}
            >
              <FileText size={14} />
              <span>Artifacts ({currentTask?.artifacts?.length || 0})</span>
            </button>
          </div>

          {/* Connected Integrations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
                Connected Tools
              </span>
              <button
                onClick={() => setShowIntegrationsModal(true)}
                className="text-[10px] text-[#a1a1aa] hover:text-white underline transition-colors"
              >
                Integrations Hub
              </button>
            </div>

            <div className="space-y-1.5">
              {integrations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setShowIntegrationsModal(true)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#3a3a3c] text-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getCategoryIcon(item.id)}
                    <span className="text-xs font-medium text-white truncate">{item.name}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                </div>
              ))}
            </div>

            {/* Recent Tasks List */}
            {recentTasks.length > 0 && (
              <div className="pt-3 border-t border-[#222226] space-y-2">
                <span className="block px-2 text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
                  Recent Tasks
                </span>
                {recentTasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTask(t);
                      if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      currentTask?.id === t.id
                        ? "bg-[#1c1c1e] border-white text-white shadow-sm"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
                    }`}
                  >
                    <div className="text-xs font-semibold text-white truncate">{t.userQuery}</div>
                    <div className="text-[10px] text-[#636366] font-mono mt-0.5 capitalize">{t.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#222226] bg-[#111113] flex items-center justify-between text-xs text-[#8e8e93]">
            <span>Clarity CoWork Agent Core</span>
            <span className="text-[10px] font-mono text-emerald-400">Ready</span>
          </div>
        </aside>

        {/* ── COLUMN 2: CENTER COLUMN (AGENT WORKSPACE) ── */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#000000] relative">
          
          {/* Subheader Toolbar */}
          <div className="h-12 px-6 bg-[#111113]/60 border-b border-[#222226] flex items-center justify-between flex-shrink-0 text-xs text-[#8e8e93]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {currentTask ? currentTask.userQuery : "Clarity CoWork Multi-Tool Workspace"}
              </span>
            </div>

            {currentTask && (
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                  currentTask.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  currentTask.status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                  currentTask.status === "waiting_approval" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-zinc-800 text-zinc-400"
                }`}>
                  {currentTask.status}
                </span>
              </div>
            )}
          </div>

          {/* Scrollable Center Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <div className="max-w-3xl mx-auto space-y-6">

              {/* 1. DYNAMIC MULTI-STEP PLAN STEPPER */}
              {currentTask && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                      <Sparkles size={14} className="text-white" /> Execution Plan
                    </span>
                    <span className="text-[10px] font-mono text-[#8e8e93]">
                      Goal: "{currentTask.userQuery}"
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTask.plan.map((step) => (
                      <div key={step.id} className="flex items-center gap-3 text-xs">
                        {step.status === "completed" && <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />}
                        {step.status === "running" && <RefreshCw size={15} className="text-blue-400 animate-spin flex-shrink-0" />}
                        {step.status === "waiting" && <Clock size={15} className="text-[#636366] flex-shrink-0" />}
                        {step.status === "approval_required" && <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />}
                        {step.status === "failed" && <XCircle size={15} className="text-red-400 flex-shrink-0" />}

                        <span className={`font-medium ${
                          step.status === "completed" ? "text-white opacity-80" :
                          step.status === "running" ? "text-white font-semibold" :
                          step.status === "approval_required" ? "text-amber-400 font-semibold" :
                          "text-[#8e8e93]"
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. MAIN AI REPORT / ARTIFACT DISPLAY */}
              {(currentTask?.report || activeArtifact) && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-white" />
                      <h3 className="text-sm font-semibold text-white">
                        {activeArtifact ? activeArtifact.title : "Agent Goal Execution Outcome"}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const contentToCopy = activeArtifact ? activeArtifact.content : currentTask?.report || "";
                        navigator.clipboard.writeText(contentToCopy);
                        setCopiedReport(true);
                        setTimeout(() => setCopiedReport(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
                    >
                      {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedReport ? "Copied" : "Copy Report"}</span>
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
                      {activeArtifact ? activeArtifact.content : currentTask?.report || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* WELCOME STATE FOR CENTER COLUMN */}
              {!currentTask && (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] mx-auto flex items-center justify-center p-3 shadow-md">
                    <Briefcase size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">Clarity CoWork Agent Workspace</h2>
                    <p className="text-xs text-[#8e8e93] leading-relaxed mt-1">
                      Give Clarity a goal across GitHub, Drive, Calendar, Gmail, Sheets, MCP, and Browser Agent.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── MAIN COMPOSER (BOTTOM INPUT BAR) ── */}
          <div className="p-4 bg-[#111113] border-t border-[#222226] flex-shrink-0 z-10">
            <div className="max-w-3xl mx-auto space-y-3">
              
              {/* Suggestion Pills */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {MULTI_TOOL_PROMPTS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptInput(sug);
                      handleStartTask(sug);
                    }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e] text-xs text-[#8e8e93] hover:text-white transition-all shadow-sm"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Main Input Capsule */}
              <div className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2c2c2e] focus-within:border-[#3a3a3c] rounded-[24px] px-4 py-2.5 shadow-lg transition-all">
                <Sparkles size={16} className="text-[#8e8e93] flex-shrink-0" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartTask();
                    }
                  }}
                  placeholder="Ask Clarity to work on something..."
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-[#f2f2f7] placeholder-[#8e8e93]"
                />

                <button
                  onClick={() => handleStartTask()}
                  disabled={!promptInput.trim() || isSubmitting}
                  className="w-8 h-8 rounded-full bg-white text-black hover:bg-[#e5e5ea] disabled:bg-[#2c2c2e] disabled:text-[#6c6c70] disabled:cursor-not-allowed active:scale-95 flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
                  title="Run Agent Workflow"
                >
                  {isSubmitting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} fill="currentColor" />
                  )}
                </button>
              </div>

            </div>
          </div>

        </main>

        {/* ── COLUMN 3: RIGHT SIDEBAR (ACTIVITY STREAM & HUMAN APPROVAL) ── */}
        <aside className="w-[300px] bg-[#111113] border-l border-[#222226] flex flex-col h-full flex-shrink-0">
          
          <div className="px-4 h-14 border-b border-[#222226] flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">Activity</span>
            {currentTask?.activityFeed?.length ? (
              <span className="text-[10px] font-mono text-[#8e8e93]">
                {currentTask.activityFeed.length} events
              </span>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* HUMAN APPROVAL CARD (UNIVERSAL SIDE-EFFECT APPROVAL) */}
            {currentTask?.pendingApproval && (
              <div className="bg-[#1c1c1e] border-2 border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl animate-fade-in">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs border-b border-[#2c2c2e] pb-2">
                  <AlertCircle size={15} />
                  <span>Approval Required</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">{currentTask.pendingApproval.title}</div>
                  <div className="text-[10px] text-[#8e8e93] font-mono capitalize">
                    Tool: {currentTask.pendingApproval.toolName} ({currentTask.pendingApproval.category})
                  </div>
                  <p className="text-[11px] text-[#d1d1d6] leading-relaxed pt-1">
                    {currentTask.pendingApproval.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCancelAction}
                    className="flex-1 py-1.5 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-[#8e8e93] hover:text-white transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAction}
                    className="flex-1 py-1.5 rounded-xl bg-white text-black hover:bg-[#e5e5ea] text-xs font-semibold transition-all text-center shadow-sm"
                  >
                    Approve & Run
                  </button>
                </div>
              </div>
            )}

            {/* MULTI-TOOL ACTIVITY STREAM */}
            {currentTask?.activityFeed && currentTask.activityFeed.length > 0 ? (
              <div className="space-y-3">
                {currentTask.activityFeed.map((act) => {
                  const isExpanded = expandedActivityId === act.id;
                  return (
                    <div
                      key={act.id}
                      onClick={() => setExpandedActivityId(isExpanded ? null : act.id)}
                      className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3 space-y-1 cursor-pointer hover:border-[#3a3a3c] transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {getCategoryIcon(act.category)}
                          <span className="text-xs font-medium text-white truncate">{act.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[#636366] flex-shrink-0">{act.timestamp}</span>
                      </div>

                      <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed">
                        {act.description}
                      </p>

                      {isExpanded && act.toolName && (
                        <div className="mt-2 pt-2 border-t border-[#2c2c2e] font-mono text-[10px] text-[#a1a1aa] space-y-1 bg-[#111113] p-2 rounded-lg">
                          <div>Tool: <strong className="text-white">{act.toolName}</strong></div>
                          {act.query && <div>Query: "{act.query}"</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-[11px] text-[#636366]">
                No tool activity events recorded yet. Ask Clarity a goal to start execution.
              </div>
            )}

          </div>

          <div className="p-4 border-t border-[#222226] bg-[#111113] text-[10px] text-[#636366] font-mono text-center">
            Multi-Tool Agent Engine • All Connections Secured
          </div>
        </aside>

      </div>

      {/* ── MODAL 1: INTEGRATIONS HUB ── */}
      {showIntegrationsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} />
                <h3 className="text-sm font-semibold text-white">Integrations Hub</h3>
              </div>
              <button
                onClick={() => setShowIntegrationsModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {integrations.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#111113] border border-[#2c2c2e]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#1c1c1e] text-white">
                      {getCategoryIcon(item.id)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{item.name}</div>
                      <div className="text-[11px] text-[#8e8e93]">
                        {item.connected ? `Connected (${item.username || item.details || "Active"})` : "Disconnected"}
                      </div>
                    </div>
                  </div>

                  {item.id === "mcp" ? (
                    <button
                      onClick={() => setShowAddMCPModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
                    >
                      + Add MCP Server
                    </button>
                  ) : item.id === "browser" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready
                    </span>
                  ) : item.connected ? (
                    <button
                      onClick={() => handleDisconnectIntegration(item.id)}
                      className="px-3 py-1 rounded-full text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium transition-all"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration(item.id)}
                      className="px-3.5 py-1 rounded-full text-[10px] bg-white text-black font-semibold hover:bg-[#e5e5ea] transition-all"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowIntegrationsModal(false)}
                className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e5e5ea] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD MCP SERVER ── */}
      {showAddMCPModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleAddMCPServer} className="w-full max-w-sm bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <Plug size={18} />
                <h3 className="text-sm font-semibold text-white">Add MCP Server</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMCPModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#8e8e93] mb-1">Server Name</label>
                <input
                  type="text"
                  value={mcpServerName}
                  onChange={(e) => setMcpServerName(e.target.value)}
                  placeholder="e.g. Custom Dev Tools MCP"
                  required
                  className="w-full bg-[#111113] border border-[#2c2c2e] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#8e8e93] mb-1">Server Endpoint URL</label>
                <input
                  type="text"
                  value={mcpServerUrl}
                  onChange={(e) => setMcpServerUrl(e.target.value)}
                  placeholder="https://mcp.domain.com/tools"
                  required
                  className="w-full bg-[#111113] border border-[#2c2c2e] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMCPModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e5e5ea] transition-all"
              >
                Register Server
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
