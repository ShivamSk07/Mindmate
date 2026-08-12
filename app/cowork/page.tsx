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
import MCPDashboardModal from "@/components/MCPDashboardModal";
import { getSupportedMCPRegistry, SupportedMCPServer } from "@/lib/mcpRegistry";

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

  // MCP Control & @Mention State
  const [showMCPDashboardModal, setShowMCPDashboardModal] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mcpRegistry, setMcpRegistry] = useState<SupportedMCPServer[]>([]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchIntegrationsStatus();
    fetchTaskHistory();
    setMcpRegistry(getSupportedMCPRegistry());
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
    <div className="h-[100dvh] w-full bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden font-sans">
      
      {/* ── TOP HEADER BAR WITH INTEGRATION NODES ── */}
      <header className="h-16 px-6 bg-[#0f0f12]/90 backdrop-blur border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center p-1.5 shadow-sm">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Clarity CoWork <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">Agentic v2</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Floating Top Integration Nodes Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141417] border border-[#232328]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">Nodes:</span>
          {integrations.map((item) => (
            <button
              key={item.id}
              onClick={() => handleOpenConnectModal(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                item.connected || item.id === "browser"
                  ? "bg-zinc-800/80 text-white border border-zinc-700 hover:border-zinc-500"
                  : "bg-transparent text-zinc-400 hover:text-zinc-200"
              }`}
              title={item.connected ? `${item.name} Connected` : `Connect ${item.name}`}
            >
              {getCategoryIcon(item.id)}
              <span className="text-[11px]">{item.name}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${item.connected || item.id === "browser" ? "bg-emerald-400" : "bg-zinc-600"}`} />
            </button>
          ))}

          <button
            onClick={() => setShowMCPDashboardModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-all ml-1"
          >
            <Plug size={12} />
            <span>MCP Registry Dashboard</span>
          </button>
        </div>

        {/* Back & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] border border-[#27272a] text-xs text-zinc-300"
          >
            <Plug size={13} /> {activeToolsCount} Tools
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:bg-[#232328] text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CANVAS ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── LEFT DRAWER (TASKS & ARTIFACTS HISTORY) ── */}
        <aside className="w-[260px] bg-[#0c0c0e] border-r border-[#1f1f23] flex flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-[#1f1f23] flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">History & Artifacts</span>
            <button
              onClick={() => {
                setCurrentTask(null);
                setActiveArtifact(null);
              }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              + New Task
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {recentTasks.length > 0 && (
              <div className="space-y-1.5">
                <span className="block px-1 text-[10px] font-mono text-zinc-400">RECENT AGENT GOALS</span>
                {recentTasks.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTask(t);
                      if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      currentTask?.id === t.id
                        ? "bg-[#18181c] border-zinc-600 text-white"
                        : "bg-[#121215] border-[#232328] text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]"
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{t.userQuery}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 capitalize">{t.status}</div>
                  </div>
                ))}
              </div>
            )}

            {currentTask?.artifacts && currentTask.artifacts.length > 0 && (
              <div className="pt-3 border-t border-[#1f1f23] space-y-1.5">
                <span className="block px-1 text-[10px] font-mono text-zinc-400">GENERATED ARTIFACTS</span>
                {currentTask.artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtifact(art)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      activeArtifact?.id === art.id
                        ? "bg-[#18181c] border-zinc-600 text-white"
                        : "bg-[#121215] border-[#232328] text-zinc-400 hover:text-zinc-200"
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
        </aside>

        {/* ── CENTER STAGE: GEMINI / MANUS STYLE CONVERSATION & EXECUTION CANVAS ── */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#09090b] relative">
          
          <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">

              {/* WELCOME CANVAS WHEN NO TASK ACTIVE */}
              {!currentTask && (
                <div className="py-16 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center p-3 shadow-xl">
                    <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h2 className="text-2xl font-bold text-white tracking-tight">What would you like Clarity CoWork to do?</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Connect your tools and run autonomous multi-tool agent workflows across GitHub, Google Drive, Gmail, Calendar, Sheets, MCP, and Web search.
                    </p>
                  </div>

                  {/* Integration Nodes Pill Grid */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto pt-2">
                    {integrations.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleOpenConnectModal(item.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                          item.connected || item.id === "browser"
                            ? "bg-[#141417] border-zinc-700 text-white hover:border-zinc-500"
                            : "bg-[#0f0f12] border-[#232328] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {getCategoryIcon(item.id)}
                        <span>{item.name}</span>
                        <span className={`w-2 h-2 rounded-full ${item.connected || item.id === "browser" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIVE AGENT TASK CANVAS */}
              {currentTask && (
                <div className="space-y-6">
                  
                  {/* User Query Banner */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#121215] border border-[#232328]">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-xs flex-shrink-0">
                      You
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-mono text-zinc-500">AGENT GOAL REQUEST</div>
                      <div className="text-base font-semibold text-white">{currentTask.userQuery}</div>
                    </div>
                  </div>

                  {/* EXECUTION PLAN TIMELINE NODE STEPPER */}
                  <div className="p-6 rounded-2xl bg-[#121215] border border-[#232328] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#232328] pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <Layers size={15} className="text-violet-400" /> Execution Node Workflow
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        currentTask.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        currentTask.status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {currentTask.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {currentTask.plan.map((step) => (
                        <div key={step.id} className="flex items-center gap-3.5 text-xs">
                          {step.status === "completed" && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                          {step.status === "running" && <RefreshCw size={16} className="text-blue-400 animate-spin flex-shrink-0" />}
                          {step.status === "waiting" && <Clock size={16} className="text-zinc-600 flex-shrink-0" />}
                          {step.status === "approval_required" && <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />}
                          {step.status === "failed" && <XCircle size={16} className="text-rose-400 flex-shrink-0" />}

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

                  {/* MAIN AI RESPONSE & ARTIFACT CARD */}
                  {(currentTask.report || activeArtifact) && (
                    <div className="p-6 md:p-8 rounded-2xl bg-[#121215] border border-[#232328] space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-[#232328] pb-3">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={18} className="text-violet-400" />
                          <h3 className="text-sm font-bold text-white">
                            {activeArtifact ? activeArtifact.title : "Agent Response & Workspace Findings"}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            const contentToCopy = activeArtifact ? activeArtifact.content : currentTask?.report || "";
                            navigator.clipboard.writeText(contentToCopy);
                            setCopiedReport(true);
                            setTimeout(() => setCopiedReport(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#25252a] text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-[#2e2e34]"
                        >
                          {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          <span>{copiedReport ? "Copied" : "Copy Output"}</span>
                        </button>
                      </div>

                      <div className="text-xs md:text-sm leading-relaxed text-zinc-200 font-sans overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-base md:text-lg font-bold my-3 text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm md:text-base font-semibold my-2.5 text-white border-b border-[#232328] pb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs md:text-sm font-semibold my-2 text-white">{children}</h3>,
                            p: ({ children }) => <p className="mb-2.5 leading-relaxed text-zinc-300">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-zinc-300">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-zinc-300">{children}</ol>,
                            code: ({ children, ...props }) => (
                              <code className="bg-[#09090b] border border-[#232328] rounded px-1.5 py-0.5 text-xs font-mono text-zinc-200" {...props}>
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-[#09090b] border border-[#232328] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono text-zinc-200">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {activeArtifact ? activeArtifact.content : currentTask.report || ""}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

          {/* ── FLOATING GEMINI / MANUS STYLE COMPOSER DOCK ── */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
            <div className="bg-[#121215]/95 backdrop-blur-xl border border-[#27272a] rounded-2xl p-3 shadow-2xl space-y-2.5">
              
              {/* Top Quick Tools Selector Chips */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
                <span className="text-[10px] font-mono uppercase text-zinc-500 flex-shrink-0">Connected Tools:</span>
                {integrations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenConnectModal(item.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                      item.connected || item.id === "browser"
                        ? "bg-[#1a1a1e] border-zinc-700 text-zinc-200 hover:border-zinc-500"
                        : "bg-transparent border-[#232328] text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {getCategoryIcon(item.id)}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>

              {/* @Mention Autocomplete Dropdown */}
              {showMentionMenu && (
                <div className="p-2 rounded-xl bg-[#141417] border border-[#27272a] shadow-2xl space-y-1 animate-fade-in text-xs max-h-48 overflow-y-auto scrollbar-thin">
                  <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 flex items-center justify-between border-b border-[#232328]">
                    <span>SUPPORTED MCP SERVERS (@MENTION TO DIRECT)</span>
                    <button onClick={() => setShowMentionMenu(false)} className="hover:text-white">✕</button>
                  </div>
                  {mcpRegistry.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const cleanPrompt = promptInput.endsWith("@") ? promptInput.slice(0, -1) : promptInput;
                        setPromptInput(`${cleanPrompt} ${item.tag} `);
                        setShowMentionMenu(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1f1f23] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <div>
                          <span className="font-bold text-white mr-1.5">{item.tag}</span>
                          <span className="text-zinc-400 text-[11px]">{item.name}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#09090b] text-zinc-400 border border-[#232328]">
                        {item.enabled ? "Active" : "Config Required"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Main Input Field */}
              <div className="flex items-center gap-3 bg-[#09090b] border border-[#27272a] focus-within:border-violet-500/60 rounded-xl px-4 py-3 transition-all relative">
                <Sparkles size={18} className="text-violet-400 flex-shrink-0" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => {
                    setPromptInput(e.target.value);
                    if (e.target.value.endsWith("@")) {
                      setShowMentionMenu(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartTask();
                    }
                  }}
                  placeholder="Type @stitch, @postgres, @github or describe your goal..."
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-100 placeholder-zinc-500"
                />

                <button
                  type="button"
                  onClick={() => setShowMentionMenu(!showMentionMenu)}
                  className="text-xs font-mono px-2 py-1 rounded bg-[#18181c] border border-[#232328] text-violet-300 hover:text-white transition-colors"
                  title="Mention MCP Server"
                >
                  @mention
                </button>

                <button
                  onClick={() => handleStartTask()}
                  disabled={!promptInput.trim() || isSubmitting}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 font-semibold text-xs transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-md"
                >
                  {isSubmitting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <>
                      <span>Run</span>
                      <Play size={12} fill="currentColor" />
                    </>
                  )}
                </button>
              </div>

              {/* Suggestion Prompt Pills */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
                {MULTI_TOOL_PROMPTS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptInput(sug);
                      handleStartTask(sug);
                    }}
                    className="flex-shrink-0 px-2.5 py-1 rounded-md bg-[#18181c] hover:bg-[#232328] border border-[#232328] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

            </div>
          </div>

        </main>

        {/* ── RIGHT DRAWER: LIVE ACTIVITY LOG STREAM ── */}
        <aside className="w-[280px] bg-[#0c0c0e] border-l border-[#1f1f23] flex flex-col h-full flex-shrink-0">
          <div className="px-4 h-14 border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Live Activity Feed</span>
            {currentTask?.activityFeed?.length ? (
              <span className="text-[10px] font-mono text-zinc-500">
                {currentTask.activityFeed.length} events
              </span>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {/* HUMAN APPROVAL CARD */}
            {currentTask?.pendingApproval && (
              <div className="bg-[#141417] border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-[#232328] pb-2">
                  <AlertCircle size={15} />
                  <span>Human Approval Required</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white">{currentTask.pendingApproval.title}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Resource: {currentTask.pendingApproval.targetResource}</div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed pt-1">{currentTask.pendingApproval.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={handleCancelAction} className="flex-1 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#27272a] text-xs text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleApproveAction} className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">Approve</button>
                </div>
              </div>
            )}

            {currentTask?.activityFeed && currentTask.activityFeed.length > 0 ? (
              <div className="space-y-2.5">
                {currentTask.activityFeed.map((act) => (
                  <div key={act.id} className="bg-[#121215] border border-[#232328] rounded-xl p-3 space-y-1 hover:border-[#2e2e34] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {getCategoryIcon(act.category)}
                        <span className="text-xs font-medium text-zinc-200 truncate">{act.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 flex-shrink-0">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{act.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[11px] text-zinc-500">
                No tool activity recorded yet. Run a goal task to view live execution logs.
              </div>
            )}
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
      {/* ── MODAL 4: MCP DASHBOARD CONTROL MODAL ── */}
      <MCPDashboardModal
        isOpen={showMCPDashboardModal}
        onClose={() => setShowMCPDashboardModal(false)}
        onRegistryUpdated={() => setMcpRegistry(getSupportedMCPRegistry())}
      />

    </div>
  );
}
