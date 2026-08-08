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
  CheckSquare
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

  // Left Drawer / Workspace Nav State
  const [workspaceNav, setWorkspaceNav] = useState<"overview" | "tasks" | "artifacts">("overview");

  // Task & Execution State
  const [recentTasks, setRecentTasks] = useState<CoworkTask[]>([]);
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

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

  const QUICK_STARTERS = [
    {
      title: "Audit GitHub Codebase",
      desc: "Audit Mindmate codebase for security & launch readiness",
      prompt: "Audit my GitHub codebase for security and launch readiness",
      icon: <Github size={18} className="text-white" />,
    },
    {
      title: "Compare Drive Proposal vs Code",
      desc: "Compare project proposal in Drive with GitHub repository",
      prompt: "Compare my project proposal in Drive with my GitHub repository",
      icon: <HardDrive size={18} className="text-white" />,
    },
    {
      title: "Schedule Review & Email Draft",
      desc: "Find available slot tomorrow and draft email response to team",
      prompt: "Check tomorrow's calendar schedule and draft an email response to Rahul",
      icon: <Calendar size={18} className="text-white" />,
    },
    {
      title: "Analyze Sheets Data",
      desc: "Analyze quarterly sales metrics spreadsheet",
      prompt: "Analyze sales dataset in Google Sheets and prepare summary report",
      icon: <FileSpreadsheet size={18} className="text-white" />,
    },
  ];

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0c] text-[#f2f2f7] flex flex-col overflow-hidden font-sans">
      
      {/* ── MINIMAL TOP BAR ── */}
      <header className="h-14 px-6 bg-[#111114] border-b border-[#222226] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-xl bg-[#1c1c20] border border-[#2c2c30] flex items-center justify-center p-1 shadow-sm">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Clarity CoWork</span>
          </Link>
          <span className="text-xs text-[#52525b]">/</span>
          <span className="text-xs text-[#a1a1aa] font-medium">Agentic Workspace</span>
        </div>

        {/* Tools Pill & Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c20] border border-[#2c2c30] hover:border-[#3f3f46] text-xs transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-medium">{activeToolsCount} Connected</span>
            <span className="text-[#a1a1aa] text-[11px] underline">Manage</span>
          </button>

          {currentTask && (
            <button
              onClick={() => setShowActivityDrawer(!showActivityDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                showActivityDrawer
                  ? "bg-[#27272a] border-white text-white"
                  : "bg-[#1c1c20] border-[#2c2c30] text-[#a1a1aa] hover:text-white"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Activity Log</span>
            </button>
          )}

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c20] border border-[#2c2c30] hover:bg-[#27272a] text-xs font-medium text-[#a1a1aa] hover:text-white transition-all"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── LEFT SIDEBAR (CLEAN TASK HISTORY & CONTEXT) ── */}
        <aside className="w-[260px] bg-[#111114] border-r border-[#222226] flex flex-col h-full flex-shrink-0">
          
          <div className="p-4 border-b border-[#222226] space-y-2">
            <button
              onClick={() => {
                setCurrentTask(null);
                setActiveArtifact(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e4e4e7] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>New CoWork Task</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            
            {/* Recent Agent Tasks */}
            <div className="space-y-1">
              <span className="block px-2 text-[10px] font-semibold uppercase tracking-wider text-[#71717a] mb-1">
                Recent Agent Tasks
              </span>
              {recentTasks.length > 0 ? (
                recentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTask(t);
                      if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      currentTask?.id === t.id
                        ? "bg-[#27272a] border-white text-white shadow-sm"
                        : "bg-[#141417] border-[#222226] text-[#a1a1aa] hover:text-white hover:bg-[#1c1c20]"
                    }`}
                  >
                    <div className="text-xs font-medium text-white truncate">{t.userQuery}</div>
                    <div className="flex items-center justify-between text-[10px] text-[#71717a] mt-1 font-mono">
                      <span className="capitalize">{t.status}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-[11px] text-[#71717a]">
                  No tasks recorded yet. Start a new task below.
                </div>
              )}
            </div>

            {/* Artifacts Section */}
            {currentTask?.artifacts && currentTask.artifacts.length > 0 && (
              <div className="pt-3 border-t border-[#222226] space-y-2">
                <span className="block px-2 text-[10px] font-semibold uppercase tracking-wider text-[#71717a]">
                  Generated Artifacts
                </span>
                {currentTask.artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtifact(art)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeArtifact?.id === art.id
                        ? "bg-[#27272a] border-white text-white"
                        : "bg-[#141417] border-[#222226] text-[#a1a1aa] hover:text-white hover:bg-[#1c1c20]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate font-medium">
                      <FileText size={13} className="text-[#a1a1aa] flex-shrink-0" />
                      <span className="truncate">{art.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="p-4 border-t border-[#222226] bg-[#111114] text-[10px] text-[#71717a] font-mono flex items-center justify-between">
            <span>Clarity CoWork v2.5</span>
            <span className="text-emerald-400">Active</span>
          </div>
        </aside>

        {/* ── CENTER STAGE (FOCUSED AGENT WORKSPACE) ── */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#0a0a0c] relative">
          
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 scrollbar-thin">
            <div className="max-w-3xl mx-auto space-y-6">

              {/* 1. HERO EMPTY STATE (CLEAN 1-CLICK STARTERS) */}
              {!currentTask && (
                <div className="py-8 space-y-8 animate-fade-in">
                  
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#141417] border border-[#27272a] mx-auto flex items-center justify-center p-3.5 shadow-xl">
                      <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      What would you like Clarity to achieve today?
                    </h1>
                    <p className="text-xs text-[#a1a1aa] max-w-lg mx-auto leading-relaxed">
                      Clarity autonomously operates across your connected GitHub, Drive, Calendar, Gmail, Sheets, and Web tools to inspect code, write reports, and execute tasks.
                    </p>
                  </div>

                  {/* 1-Click Starter Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {QUICK_STARTERS.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setPromptInput(item.prompt);
                          handleStartTask(item.prompt);
                        }}
                        className="bg-[#141417] hover:bg-[#1c1c20] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 cursor-pointer transition-all space-y-2 group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-xl bg-[#1c1c20] group-hover:bg-[#27272a] transition-colors">
                            {item.icon}
                          </div>
                          <ArrowRight size={14} className="text-[#71717a] group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{item.title}</div>
                          <div className="text-[11px] text-[#71717a] line-clamp-2 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* 2. DYNAMIC EXECUTION PLAN TIMELINE */}
              {currentTask && (
                <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                      <Sparkles size={14} className="text-white" /> Goal Execution Plan
                    </span>
                    <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#1c1c20] px-2.5 py-1 rounded-full border border-[#27272a]">
                      Status: {currentTask.status}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {currentTask.plan.map((step) => (
                      <div key={step.id} className="flex items-center gap-3 text-xs">
                        {step.status === "completed" && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                        {step.status === "running" && <RefreshCw size={16} className="text-blue-400 animate-spin flex-shrink-0" />}
                        {step.status === "waiting" && <Clock size={16} className="text-[#52525b] flex-shrink-0" />}
                        {step.status === "approval_required" && <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />}
                        {step.status === "failed" && <XCircle size={16} className="text-red-400 flex-shrink-0" />}

                        <span className={`font-medium ${
                          step.status === "completed" ? "text-white opacity-80" :
                          step.status === "running" ? "text-white font-semibold" :
                          step.status === "approval_required" ? "text-amber-400 font-semibold" :
                          "text-[#71717a]"
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. UNIVERSAL APPROVAL BANNER (WHEN WRITE ACTION REQUIRES AUTHORIZATION) */}
              {currentTask?.pendingApproval && (
                <div className="bg-[#141417] border-2 border-amber-500/50 rounded-2xl p-5 space-y-3 shadow-xl animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs border-b border-[#27272a] pb-2">
                    <AlertCircle size={16} />
                    <span>User Approval Required for Write Operation</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-white">{currentTask.pendingApproval.title}</div>
                    <div className="text-[11px] text-[#a1a1aa] font-mono">
                      Target: {currentTask.pendingApproval.targetResource}
                    </div>
                    <p className="text-xs text-[#d4d4d8] leading-relaxed pt-1">
                      {currentTask.pendingApproval.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleCancelAction}
                      className="flex-1 py-2 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-[#a1a1aa] hover:text-white transition-all text-center"
                    >
                      Cancel Action
                    </button>
                    <button
                      onClick={handleApproveAction}
                      className="flex-1 py-2 rounded-xl bg-white text-black hover:bg-[#e4e4e7] text-xs font-semibold transition-all text-center shadow-md"
                    >
                      Approve & Execute
                    </button>
                  </div>
                </div>
              )}

              {/* 4. MAIN EXECUTIVE RESULT & ARTIFACT VIEWER */}
              {(currentTask?.report || activeArtifact) && (
                <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-white" />
                      <h3 className="text-sm font-semibold text-white">
                        {activeArtifact ? activeArtifact.title : "Executive Goal Report"}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const contentToCopy = activeArtifact ? activeArtifact.content : currentTask?.report || "";
                        navigator.clipboard.writeText(contentToCopy);
                        setCopiedReport(true);
                        setTimeout(() => setCopiedReport(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-xs font-medium text-white transition-all"
                    >
                      {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedReport ? "Copied" : "Copy Content"}</span>
                    </button>
                  </div>

                  <div className="text-xs leading-relaxed text-[#f4f4f5] font-sans overflow-x-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold my-3 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold my-2.5 text-white border-b border-[#27272a] pb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold my-2 text-white">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 leading-relaxed text-[#d4d4d8]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-[#d4d4d8]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-[#d4d4d8]">{children}</ol>,
                        code: ({ children, ...props }) => (
                          <code className="bg-[#0a0a0c] border border-[#27272a] rounded px-1.5 py-0.5 text-xs font-mono text-white" {...props}>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono text-[#f4f4f5]">
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

            </div>
          </div>

          {/* ── FLOATING MAIN COMPOSER CAPSULE ── */}
          <div className="p-4 md:p-6 bg-[#0a0a0c] border-t border-[#1c1c20] flex-shrink-0 z-10">
            <div className="max-w-3xl mx-auto">
              
              <div className="flex items-center gap-2 bg-[#141417] border border-[#27272a] focus-within:border-[#52525b] rounded-[24px] px-4 py-3 shadow-xl transition-all">
                <Sparkles size={16} className="text-[#71717a] flex-shrink-0" />
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
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-[#f4f4f5] placeholder-[#71717a]"
                />

                <button
                  onClick={() => handleStartTask()}
                  disabled={!promptInput.trim() || isSubmitting}
                  className="w-9 h-9 rounded-full bg-white text-black hover:bg-[#e4e4e7] disabled:bg-[#27272a] disabled:text-[#52525b] disabled:cursor-not-allowed active:scale-95 flex items-center justify-center transition-all flex-shrink-0 shadow-md"
                  title="Run Goal"
                >
                  {isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                </button>
              </div>

            </div>
          </div>

        </main>

        {/* ── OPTIONAL RIGHT SLIDE-OUT ACTIVITY DRAWER ── */}
        {showActivityDrawer && currentTask && (
          <aside className="w-[320px] bg-[#111114] border-l border-[#222226] flex flex-col h-full flex-shrink-0 animate-fade-in">
            <div className="px-4 h-14 border-b border-[#222226] flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Live Activity Stream</span>
              <button
                onClick={() => setShowActivityDrawer(false)}
                className="text-[#71717a] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {currentTask.activityFeed.map((act) => (
                <div key={act.id} className="bg-[#141417] border border-[#27272a] rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#a1a1aa] font-medium">
                    <span className="truncate">{act.title}</span>
                    <span className="text-[9px] font-mono text-[#52525b]">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#71717a] leading-relaxed">{act.description}</p>
                </div>
              ))}
            </div>
          </aside>
        )}

      </div>

      {/* ── INTEGRATIONS HUB MODAL ── */}
      {showIntegrationsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#141417] border border-[#27272a] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f4f4f5]">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} />
                <h3 className="text-sm font-semibold text-white">Connected Tools</h3>
              </div>
              <button
                onClick={() => setShowIntegrationsModal(false)}
                className="text-[#71717a] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {integrations.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div>
                    <div className="text-xs font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-[#71717a]">
                      {item.connected ? `Connected (${item.username || item.details || "Active"})` : "Disconnected"}
                    </div>
                  </div>

                  {item.id === "browser" ? (
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
                      className="px-3.5 py-1 rounded-full text-[10px] bg-white text-black font-semibold hover:bg-[#e4e4e7] transition-all"
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
                className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-[#e4e4e7] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
