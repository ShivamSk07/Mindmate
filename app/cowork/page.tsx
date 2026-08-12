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
  AlertCircle,
  FileText,
  Play,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Plus,
  Layers,
  Code2,
  ChevronRight,
  SlidersHorizontal,
  X,
  Compass,
  ArrowRight,
  UserCheck,
  Lock,
  KeyRound,
  ExternalLink
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface IntegrationItem {
  id: string;
  name: string;
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
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
}

export default function CoworkPage() {
  const router = useRouter();

  // Integrations State
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [activeToolsCount, setActiveToolsCount] = useState(1);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Auth Dialog Modals State
  const [showGitHubAuthModal, setShowGitHubAuthModal] = useState(false);
  const [githubUsernameInput, setGithubUsernameInput] = useState("ShivamSk07");
  const [githubTokenInput, setGithubTokenInput] = useState("");

  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");

  const [showAddMCPModal, setShowAddMCPModal] = useState(false);
  const [mcpServerName, setMcpServerName] = useState("");
  const [mcpServerUrl, setMcpServerUrl] = useState("");

  // Left Sidebar State
  const [workspaceNav, setWorkspaceNav] = useState<"overview" | "tasks" | "artifacts">("overview");

  // Task & Execution State
  const [recentTasks, setRecentTasks] = useState<CoworkTask[]>([]);
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setActiveToolsCount(data.activeToolsCount || 1);
      }
    } catch (e) {
      console.error("Failed to fetch status", e);
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
      console.error("Failed to fetch history", e);
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
          console.error("Polling task failed", e);
        }
      }, 1000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentTask?.id, currentTask?.status, activeArtifact]);

  // 3. Start Agentic Task
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

  // 4. Approval Handlers
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

  // 5. Client ID OAuth 2.0 Direct Redirect Handlers
  const handleOpenConnectModal = (id: string) => {
    if (id === "github") {
      window.location.href = "/api/auth/github";
    } else if (["drive", "calendar", "gmail", "sheets"].includes(id)) {
      window.location.href = "/api/auth/google";
    } else if (id === "mcp") {
      setShowAddMCPModal(true);
    }
  };

  const handleSubmitGitHubAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingId("github");
    try {
      const res = await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          username: githubUsernameInput.trim(),
          token: githubTokenInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowGitHubAuthModal(false);
        fetchIntegrationsStatus();
      }
    } catch (e) {
      console.error("GitHub Auth Error", e);
    } finally {
      setConnectingId(null);
    }
  };

  const handleSubmitGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingId("google");
    try {
      const res = await fetch("/api/cowork/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          email: googleEmailInput.trim() || "shivam@clarity.app",
        }),
      });
      if (res.ok) {
        setShowGoogleAuthModal(false);
        fetchIntegrationsStatus();
      }
    } catch (e) {
      console.error("Google Auth Error", e);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnectIntegration = async (id: string) => {
    setConnectingId(id);
    try {
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
      await fetchIntegrationsStatus();
    } catch (e) {
      console.error("Disconnect error", e);
    } finally {
      setConnectingId(null);
    }
  };

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

  const MULTI_TOOL_PROMPTS = [
    "Audit my GitHub codebase for launch readiness",
    "Compare Drive proposal specs with GitHub code",
    "Check tomorrow's calendar & draft email reply",
    "Analyze sales dataset in Google Sheets",
  ];

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] text-zinc-200 flex flex-col overflow-hidden font-sans">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="h-14 px-5 bg-[#0f0f12] border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center p-1">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-zinc-100 tracking-tight">Clarity CoWork</span>
          </Link>
          <span className="text-xs text-zinc-600">/</span>
          <span className="text-xs font-mono text-zinc-400">Enterprise Workspace</span>
        </div>

        {/* Tools Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181c] border border-[#27272a] hover:bg-[#232328] text-xs transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-200 font-medium">{activeToolsCount} Active Tools</span>
            <span className="text-zinc-400 text-[11px] font-mono ml-1">Integrations Hub</span>
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181c] border border-[#27272a] hover:bg-[#232328] text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* ── 3-COLUMN WORKSPACE LAYOUT ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── COLUMN 1: LEFT SIDEBAR (WORKSPACE & INTEGRATIONS SUITE) ── */}
        <aside className="w-[280px] bg-[#0f0f12] border-r border-[#1f1f23] flex flex-col h-full flex-shrink-0">
          
          <div className="p-4 border-b border-[#1f1f23] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <span>Workspace</span>
              <button
                onClick={() => {
                  setCurrentTask(null);
                  setActiveArtifact(null);
                }}
                className="text-[10px] text-zinc-300 hover:text-white transition-colors"
              >
                + New Goal
              </button>
            </div>

            <button
              onClick={() => setWorkspaceNav("overview")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                workspaceNav === "overview"
                  ? "bg-[#18181c] text-white border border-[#27272a]"
                  : "text-zinc-400 hover:text-white hover:bg-[#18181c]/60"
              }`}
            >
              <Briefcase size={14} />
              <span>Agent Stage</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* CONNECTED TOOLS SUITE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Connected Tools
                </span>
                <button
                  onClick={() => setShowIntegrationsModal(true)}
                  className="text-[10px] text-zinc-400 hover:text-white transition-colors"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-1.5">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#141417] border border-[#232328] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getCategoryIcon(item.id)}
                      <span className="text-xs font-medium text-zinc-200 truncate">{item.name}</span>
                    </div>

                    {item.id === "browser" ? (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ready
                      </span>
                    ) : item.connected ? (
                      <button
                        onClick={() => handleDisconnectIntegration(item.id)}
                        disabled={connectingId === item.id}
                        className="text-[10px] font-mono text-emerald-400 hover:text-rose-400 transition-colors"
                        title="Click to disconnect"
                      >
                        {connectingId === item.id ? "..." : "Connected"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenConnectModal(item.id)}
                        disabled={connectingId === item.id}
                        className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 text-[10px] font-semibold hover:bg-white transition-colors"
                      >
                        {connectingId === item.id ? "..." : "Connect"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Tasks List */}
            {recentTasks.length > 0 && (
              <div className="pt-3 border-t border-[#1f1f23] space-y-2">
                <span className="block px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Recent Tasks ({recentTasks.length})
                </span>
                {recentTasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTask(t);
                      if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      currentTask?.id === t.id
                        ? "bg-[#18181c] border-zinc-500 text-white"
                        : "bg-[#141417] border-[#232328] text-zinc-400 hover:text-white hover:bg-[#18181c]"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-200 truncate">{t.userQuery}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 capitalize">{t.status}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Artifacts List */}
            {currentTask?.artifacts && currentTask.artifacts.length > 0 && (
              <div className="pt-3 border-t border-[#1f1f23] space-y-2">
                <span className="block px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Generated Artifacts
                </span>
                {currentTask.artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtifact(art)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      activeArtifact?.id === art.id
                        ? "bg-[#18181c] border-zinc-500 text-white"
                        : "bg-[#141417] border-[#232328] text-zinc-400 hover:text-white hover:bg-[#18181c]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate font-medium">
                      <FileText size={13} className="text-zinc-400 flex-shrink-0" />
                      <span className="truncate">{art.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="p-3 border-t border-[#1f1f23] bg-[#0f0f12] flex items-center justify-between text-xs text-zinc-500">
            <span>Clarity Agent Engine</span>
            <span className="text-[10px] font-mono text-emerald-400">OAuth Active</span>
          </div>
        </aside>

        {/* ── COLUMN 2: CENTER COLUMN (AGENT STAGE & RESULTS) ── */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#09090b] relative">
          
          {/* Subheader Toolbar */}
          <div className="h-12 px-6 bg-[#0f0f12]/80 border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                {currentTask ? currentTask.userQuery : "Agent Execution Stage"}
              </span>
            </div>

            {currentTask && (
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
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

              {/* 1. DYNAMIC EXECUTION PLAN TIMELINE STEPPER */}
              {currentTask && (
                <div className="bg-[#141417] border border-[#232328] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232328] pb-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <Layers size={14} className="text-zinc-400" /> Execution Plan
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Goal: "{currentTask.userQuery}"
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTask.plan.map((step) => (
                      <div key={step.id} className="flex items-center gap-3 text-xs">
                        {step.status === "completed" && <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />}
                        {step.status === "running" && <RefreshCw size={15} className="text-blue-400 animate-spin flex-shrink-0" />}
                        {step.status === "waiting" && <Clock size={15} className="text-zinc-600 flex-shrink-0" />}
                        {step.status === "approval_required" && <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />}
                        {step.status === "failed" && <XCircle size={15} className="text-rose-400 flex-shrink-0" />}

                        <span className={`font-medium ${
                          step.status === "completed" ? "text-zinc-300" :
                          step.status === "running" ? "text-white font-semibold" :
                          step.status === "approval_required" ? "text-amber-400 font-semibold" :
                          "text-zinc-500"
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
                <div className="bg-[#141417] border border-[#232328] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232328] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-zinc-400" />
                      <h3 className="text-sm font-semibold text-white">
                        {activeArtifact ? activeArtifact.title : "Agent Response"}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const contentToCopy = activeArtifact ? activeArtifact.content : currentTask?.report || "";
                        navigator.clipboard.writeText(contentToCopy);
                        setCopiedReport(true);
                        setTimeout(() => setCopiedReport(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#27272a] text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-[#27272a]"
                    >
                      {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedReport ? "Copied" : "Copy Content"}</span>
                    </button>
                  </div>

                  <div className="text-xs leading-relaxed text-zinc-200 font-sans overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold my-3 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold my-2.5 text-white border-b border-[#232328] pb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold my-2 text-white">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 leading-relaxed text-zinc-300">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-zinc-300">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-zinc-300">{children}</ol>,
                        code: ({ children, ...props }) => (
                          <code className="bg-[#0f0f12] border border-[#232328] rounded px-1.5 py-0.5 text-xs font-mono text-zinc-200" {...props}>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-[#0f0f12] border border-[#232328] rounded-lg p-4 overflow-x-auto text-xs my-3 font-mono text-zinc-200">
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

              {/* WELCOME / EMPTY STATE FOR CENTER COLUMN */}
              {!currentTask && (
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#141417] border border-[#232328] mx-auto flex items-center justify-center p-2.5">
                    <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">Clarity CoWork Workspace</h2>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mt-1">
                      Execute goal-driven tasks across GitHub, Drive, Calendar, Gmail, Sheets, MCP, and Web tools.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── MAIN COMPOSER (BOTTOM INPUT BAR) ── */}
          <div className="p-4 bg-[#0f0f12] border-t border-[#1f1f23] flex-shrink-0 z-10">
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
                    className="flex-shrink-0 px-3 py-1 rounded-md bg-[#141417] hover:bg-[#1f1f23] border border-[#232328] text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Main Input Capsule */}
              <div className="flex items-center gap-2 bg-[#141417] border border-[#232328] focus-within:border-zinc-500 rounded-xl px-4 py-2.5 transition-colors">
                <Briefcase size={16} className="text-zinc-500 flex-shrink-0" />
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
                  placeholder="Describe your goal for Clarity CoWork..."
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-100 placeholder-zinc-500"
                />

                <button
                  onClick={() => handleStartTask()}
                  disabled={!promptInput.trim() || isSubmitting}
                  className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                  title="Run Agent Workflow"
                >
                  {isSubmitting ? (
                    <RefreshCw size={13} className="animate-spin text-zinc-900" />
                  ) : (
                    <Play size={13} fill="currentColor" />
                  )}
                </button>
              </div>

            </div>
          </div>

        </main>

        {/* ── COLUMN 3: RIGHT SIDEBAR (REAL-TIME ACTIVITY FEED & HUMAN APPROVAL) ── */}
        <aside className="w-[300px] bg-[#0f0f12] border-l border-[#1f1f23] flex flex-col h-full flex-shrink-0">
          
          <div className="px-4 h-14 border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Activity Stream</span>
            {currentTask?.activityFeed?.length ? (
              <span className="text-[10px] font-mono text-zinc-500">
                {currentTask.activityFeed.length} events
              </span>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* HUMAN APPROVAL CARD (SHOWN PROMINENTLY FOR WRITE ACTIONS) */}
            {currentTask?.pendingApproval && (
              <div className="bg-[#141417] border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs border-b border-[#232328] pb-2">
                  <AlertCircle size={15} />
                  <span>Human Authorization Required</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">{currentTask.pendingApproval.title}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Target: {currentTask.pendingApproval.targetResource}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed pt-1">
                    {currentTask.pendingApproval.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCancelAction}
                    className="flex-1 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#27272a] text-xs font-medium text-zinc-400 hover:text-white transition-colors text-center border border-[#27272a]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAction}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold transition-colors text-center"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            {/* REAL-TIME MULTI-TOOL ACTIVITY STREAM */}
            {currentTask?.activityFeed && currentTask.activityFeed.length > 0 ? (
              <div className="space-y-2.5">
                {currentTask.activityFeed.map((act) => (
                  <div
                    key={act.id}
                    className="bg-[#141417] border border-[#232328] rounded-lg p-3 space-y-1 hover:border-[#2e2e34] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {getCategoryIcon(act.category)}
                        <span className="text-xs font-medium text-zinc-200 truncate">{act.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 flex-shrink-0">{act.timestamp}</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[11px] text-zinc-500">
                No tool activity recorded yet. Run a goal to inspect live execution.
              </div>
            )}

          </div>

          <div className="p-3 border-t border-[#1f1f23] bg-[#0f0f12] text-[10px] text-zinc-500 font-mono text-center">
            Clarity CoWork • Verified Workspace Engine
          </div>
        </aside>

      </div>

      {/* ── MODAL 1: INTEGRATIONS HUB ── */}
      {showIntegrationsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
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

                  {item.id === "browser" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready
                    </span>
                  ) : item.connected ? (
                    <button
                      onClick={() => handleDisconnectIntegration(item.id)}
                      disabled={connectingId === item.id}
                      className="px-3 py-1 rounded-full text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium transition-all"
                    >
                      {connectingId === item.id ? "..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenConnectModal(item.id)}
                      disabled={connectingId === item.id}
                      className="px-3.5 py-1 rounded-full text-[10px] bg-white text-black font-semibold hover:bg-[#e5e5ea] transition-all"
                    >
                      {connectingId === item.id ? "..." : "Connect"}
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

      {/* ── MODAL 2: GITHUB OAUTH AUTHORIZATION DIALOG ── */}
      {showGitHubAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSubmitGitHubAuth} className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <Github size={18} />
                <h3 className="text-sm font-semibold text-white">Authorize GitHub Integration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGitHubAuthModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <a
                href="/api/auth/github"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-[#e5e5ea] font-semibold text-xs transition-all shadow-md"
              >
                <Github size={15} />
                <span>Authorize on GitHub.com (1-Click Direct Redirect)</span>
                <ExternalLink size={13} />
              </a>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#2c2c2e]"></div>
                <span className="flex-shrink mx-3 text-[10px] text-[#8e8e93] font-mono">OR MANUAL ACCESS TOKEN</span>
                <div className="flex-grow border-t border-[#2c2c2e]"></div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#8e8e93] mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={githubUsernameInput}
                  onChange={(e) => setGithubUsernameInput(e.target.value)}
                  placeholder="e.g. ShivamSk07"
                  required
                  className="w-full bg-[#111113] border border-[#2c2c2e] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#8e8e93] mb-1">GitHub OAuth Token / Personal Access Token (Optional)</label>
                <input
                  type="password"
                  value={githubTokenInput}
                  onChange={(e) => setGithubTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[#111113] border border-[#2c2c2e] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
                <p className="text-[10px] text-[#8e8e93] mt-1">
                  Scopes: repo, read:user, user:email. Token stays strictly on backend.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGitHubAuthModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectingId === "github"}
                className="flex-1 py-2 rounded-xl bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white font-semibold text-xs transition-all"
              >
                {connectingId === "github" ? "Authorizing..." : "Save Manual Token"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 3: GOOGLE OAUTH AUTHORIZATION DIALOG ── */}
      {showGoogleAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSubmitGoogleAuth} className="w-full max-w-md bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={18} />
                <h3 className="text-sm font-semibold text-white">Authorize Google Workspace OAuth</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleAuthModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black hover:bg-[#e5e5ea] font-semibold text-xs transition-all shadow-md"
              >
                <HardDrive size={15} />
                <span>Authorize on Google.com (1-Click Direct Redirect)</span>
                <ExternalLink size={13} />
              </a>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#2c2c2e]"></div>
                <span className="flex-shrink mx-3 text-[10px] text-[#8e8e93] font-mono">OR ENTER WORKSPACE EMAIL</span>
                <div className="flex-grow border-t border-[#2c2c2e]"></div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#8e8e93] mb-1">Google Workspace Email Account</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="shivam@clarity.app"
                  required
                  className="w-full bg-[#111113] border border-[#2c2c2e] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="p-3 bg-[#111113] border border-[#2c2c2e] rounded-xl space-y-1.5 text-[11px] text-[#8e8e93]">
                <div className="text-white font-medium mb-1">Requested Permissions:</div>
                <div className="flex items-center gap-2">✓ Google Drive (read docs & PDFs)</div>
                <div className="flex items-center gap-2">✓ Google Calendar (view & schedule slots)</div>
                <div className="flex items-center gap-2">✓ Gmail (read emails & create drafts)</div>
                <div className="flex items-center gap-2">✓ Google Sheets (read datasets & rows)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleAuthModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectingId === "google"}
                className="flex-1 py-2 rounded-xl bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white font-semibold text-xs transition-all"
              >
                {connectingId === "google" ? "Authorizing..." : "Save Workspace Account"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
