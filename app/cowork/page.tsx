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
  ExternalLink,
  Maximize2,
  Minimize2,
  Info,
  Terminal,
  Send
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

interface MessageItem {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: string;
}

interface CoworkTask {
  id: string;
  userQuery: string;
  messages?: MessageItem[];
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

  // Auth Dialog Modals State
  const [showGitHubAuthModal, setShowGitHubAuthModal] = useState(false);
  const [githubUsernameInput, setGithubUsernameInput] = useState("ShivamSk07");
  const [githubTokenInput, setGithubTokenInput] = useState("");

  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");

  const [showAddMCPModal, setShowAddMCPModal] = useState(false);

  // Task & Execution State
  const [recentTasks, setRecentTasks] = useState<CoworkTask[]>([]);
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowupSubmitting, setIsFollowupSubmitting] = useState(false);

  // Artifact State
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isFullscreenCanvas, setIsFullscreenCanvas] = useState(false);

  // Inspector Modal State
  const [selectedLogItem, setSelectedLogItem] = useState<ActivityItem | null>(null);

  // MCP Control & @Mention State
  const [showMCPDashboardModal, setShowMCPDashboardModal] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mcpRegistry, setMcpRegistry] = useState<SupportedMCPServer[]>([]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

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

  // Scroll to bottom on new chat messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentTask?.messages, currentTask?.activityFeed]);

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

  // 4. Send Multi-Turn Follow-up inside current Task
  const handleSendFollowup = async () => {
    if (!currentTask || !followupInput.trim() || isFollowupSubmitting) return;

    const text = followupInput.trim();
    setFollowupInput("");
    setIsFollowupSubmitting(true);

    try {
      const res = await fetch(`/api/cowork/tasks/${currentTask.id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setCurrentTask(data.task);
        if (data.task.artifacts?.length > 0) {
          setActiveArtifact(data.task.artifacts[0]);
        }
      }
    } catch (e) {
      console.error("Follow-up submission error", e);
    } finally {
      setIsFollowupSubmitting(false);
    }
  };

  // 5. Approval Handlers
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

  const handleOpenConnectModal = (id: string) => {
    if (id === "github") {
      window.location.href = "/api/auth/github";
    } else if (["drive", "calendar", "gmail", "sheets"].includes(id)) {
      window.location.href = "/api/auth/google";
    } else if (id === "mcp") {
      setShowAddMCPModal(true);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case "github": return <Github size={14} className="text-[#a78bfa] flex-shrink-0" />;
      case "drive": return <HardDrive size={14} className="text-[#60a5fa] flex-shrink-0" />;
      case "calendar": return <Calendar size={14} className="text-[#f472b6] flex-shrink-0" />;
      case "gmail": return <Mail size={14} className="text-[#f87171] flex-shrink-0" />;
      case "sheets": return <FileSpreadsheet size={14} className="text-[#34d399] flex-shrink-0" />;
      case "mcp": return <Plug size={14} className="text-[#fbbf24] flex-shrink-0" />;
      case "browser": return <Globe size={14} className="text-[#38bdf8] flex-shrink-0" />;
      default: return <Sparkles size={14} className="text-[#a78bfa] flex-shrink-0" />;
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
      
      {/* ── TOP HEADER BAR ── */}
      <header className="h-14 px-5 bg-[#0d0d10] border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center p-1">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Clarity CoWork</span>
          </Link>
          <span className="text-xs text-zinc-600">/</span>
          <span className="text-xs font-mono text-zinc-400">Agentic Workspace</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMCPDashboardModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#232328] hover:bg-[#1f1f23] text-xs font-medium text-zinc-300 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeToolsCount} Connected Tools</span>
          </button>

          <button
            onClick={() => setShowMCPDashboardModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#232328] hover:bg-[#1f1f23] text-xs font-medium text-zinc-300 transition-colors"
          >
            <Plug size={13} className="text-amber-400" />
            <span>MCP Settings</span>
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#232328] hover:bg-[#1f1f23] text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        {/* ── LEFT DRAWER (TASKS & ARTIFACTS HISTORY) ── */}
        <aside className="w-[240px] bg-[#0c0c0e] border-r border-[#1f1f23] flex flex-col h-full flex-shrink-0">
          <div className="p-3.5 border-b border-[#1f1f23] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Agent Goals</span>
            <button
              onClick={() => {
                setCurrentTask(null);
                setActiveArtifact(null);
              }}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> New Goal
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {recentTasks.length > 0 && (
              <div className="space-y-1.5">
                <span className="block px-1 text-[10px] font-mono text-zinc-400 uppercase">Recent Executions</span>
                {recentTasks.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTask(t);
                      if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      currentTask?.id === t.id
                        ? "bg-[#18181c] border-violet-500/50 text-white shadow-md"
                        : "bg-[#111114] border-[#232328] text-zinc-400 hover:text-zinc-200 hover:bg-[#161619]"
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{t.userQuery}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        t.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                        t.status === "running" ? "bg-blue-500/10 text-blue-400" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>{t.status}</span>
                      <span className="text-[9px] text-zinc-400">{t.artifacts?.length || 0} artifacts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentTask?.artifacts && currentTask.artifacts.length > 0 && (
              <div className="pt-3 border-t border-[#1f1f23] space-y-1.5">
                <span className="block px-1 text-[10px] font-mono text-zinc-400 uppercase">Generated Canvas Artifacts</span>
                {currentTask.artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtifact(art)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeArtifact?.id === art.id
                        ? "bg-violet-950/40 border-violet-500/60 text-white"
                        : "bg-[#111114] border-[#232328] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate font-medium">
                      <FileText size={13} className="text-violet-400 flex-shrink-0" />
                      <span className="truncate">{art.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* WELCOME CANVAS WHEN NO TASK ACTIVE */}
        {!currentTask && (
          <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090b]">
            <div className="max-w-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-800/20 border border-violet-500/30 mx-auto flex items-center justify-center p-3 shadow-2xl">
                <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">What would you like Clarity CoWork to do?</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Run multi-tool agent workflows across GitHub, Google Drive, Gmail, Calendar, Sheets, MCP, and Browser agent with real-time reasoning and canvas outputs.
                </p>
              </div>

              {/* Integration Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {integrations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenConnectModal(item.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#121215] border border-[#232328] text-zinc-300 hover:border-zinc-500 transition-all"
                  >
                    {getCategoryIcon(item.id)}
                    <span>{item.name}</span>
                    <span className={`w-2 h-2 rounded-full ${item.connected || item.id === "browser" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  </button>
                ))}
              </div>

              {/* Initial Input Bar */}
              <div className="pt-4 max-w-xl mx-auto">
                <div className="flex items-center gap-3 bg-[#111114] border border-[#27272a] focus-within:border-violet-500/60 rounded-2xl p-3 shadow-2xl transition-all">
                  <Sparkles size={18} className="text-violet-400 flex-shrink-0" />
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
                    placeholder="Describe your goal or enter @stitch, @github, @drive..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-100 placeholder-zinc-500"
                  />
                  <button
                    onClick={() => handleStartTask()}
                    disabled={!promptInput.trim() || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <><span>Run Goal</span><Play size={12} fill="currentColor" /></>}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-3 justify-center">
                  {MULTI_TOOL_PROMPTS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartTask(sug)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-[#141417] hover:bg-[#1f1f23] border border-[#232328] text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ── ACTIVE SPLIT-PANE WORKSPACE (MANUS / CLAUDE COWORK STYLE) ── */}
        {currentTask && (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">
            
            {/* ── LEFT PANE: AGENT TIMELINE, LOGS & MULTI-TURN CHAT (42% Width) ── */}
            <section className="w-[42%] bg-[#09090b] border-r border-[#1f1f23] flex flex-col h-full min-w-[340px]">
              
              {/* Header Info */}
              <div className="p-4 border-b border-[#1f1f23] bg-[#0d0d10] flex items-center justify-between flex-shrink-0">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-semibold">Active Agent Task</div>
                  <h2 className="text-sm font-bold text-white truncate">{currentTask.userQuery}</h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase flex-shrink-0 ${
                  currentTask.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  currentTask.status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse" :
                  "bg-zinc-800 text-zinc-400"
                }`}>
                  {currentTask.status}
                </span>
              </div>

              {/* Scrollable Timeline & Chat Body */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                
                {/* Stepper Node Workflow */}
                <div className="p-4 rounded-xl bg-[#111114] border border-[#232328] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#232328] pb-2">
                    <span className="text-[11px] font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-violet-400" /> Execution Workflow Nodes
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
                          "text-zinc-500"
                        }`}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human Approval Card */}
                {currentTask.pendingApproval && (
                  <div className="bg-[#16141a] border border-amber-500/40 rounded-xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-[#232328] pb-2">
                      <AlertCircle size={15} />
                      <span>Human Authorization Required</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-white">{currentTask.pendingApproval.title}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">Resource: {currentTask.pendingApproval.targetResource}</div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed pt-1">{currentTask.pendingApproval.description}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button onClick={handleCancelAction} className="flex-1 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#27272a] text-xs text-zinc-400 hover:text-white transition-colors">Cancel</button>
                      <button onClick={handleApproveAction} className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">Approve Action</button>
                    </div>
                  </div>
                )}

                {/* Multi-Turn Thread Messages */}
                {currentTask.messages && currentTask.messages.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Conversation History</div>
                    {currentTask.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          msg.sender === "user"
                            ? "bg-violet-950/20 border-violet-500/30 text-violet-100 ml-4"
                            : "bg-[#121215] border-[#232328] text-zinc-200 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="font-semibold">{msg.sender === "user" ? "You" : "Clarity Agent"}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Activity Logs Stream with Inspect Buttons */}
                {currentTask.activityFeed && currentTask.activityFeed.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Live Agent Execution Logs</div>
                    {currentTask.activityFeed.map((act) => (
                      <div key={act.id} className="bg-[#111114] border border-[#232328] rounded-xl p-3 space-y-1.5 hover:border-[#2e2e34] transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {getCategoryIcon(act.category)}
                            <span className="text-xs font-semibold text-zinc-200 truncate">{act.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-400">{act.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{act.description}</p>

                        {/* Inspect Tool Log Button */}
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => setSelectedLogItem(act)}
                            className="flex items-center gap-1 text-[10px] font-mono text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            <Terminal size={11} /> Inspect Logs
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Multi-Turn Follow-Up Composer Dock */}
              <div className="p-3 border-t border-[#1f1f23] bg-[#0d0d10] flex-shrink-0 space-y-2">
                <div className="flex items-center gap-2 bg-[#141417] border border-[#27272a] focus-within:border-violet-500/60 rounded-xl px-3 py-2 transition-all">
                  <Sparkles size={16} className="text-violet-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={followupInput}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendFollowup();
                      }
                    }}
                    placeholder="Ask follow-up or request changes..."
                    disabled={isFollowupSubmitting || currentTask.status === "running"}
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-zinc-100 placeholder-zinc-500"
                  />
                  <button
                    onClick={handleSendFollowup}
                    disabled={!followupInput.trim() || isFollowupSubmitting || currentTask.status === "running"}
                    className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex-shrink-0"
                  >
                    {isFollowupSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
              </div>

            </section>

            {/* ── RIGHT PANE: INTERACTIVE WORKSPACE CANVAS (58% Width) ── */}
            <section className="flex-1 bg-[#09090b] flex flex-col h-full min-w-0 relative">
              
              {/* Canvas Navigation Header */}
              <div className="h-14 px-5 bg-[#0d0d10] border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0">
                
                {/* Artifact Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {currentTask.artifacts && currentTask.artifacts.length > 0 ? (
                    currentTask.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => setActiveArtifact(art)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeArtifact?.id === art.id
                            ? "bg-[#18181c] border border-violet-500/50 text-white shadow-sm"
                            : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#141417]"
                        }`}
                      >
                        <FileText size={13} className={activeArtifact?.id === art.id ? "text-violet-400" : "text-zinc-500"} />
                        <span className="truncate max-w-[160px]">{art.title}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono">Workspace Canvas Output</span>
                  )}
                </div>

                {/* Canvas Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const contentToCopy = activeArtifact ? activeArtifact.content : currentTask?.report || "";
                      navigator.clipboard.writeText(contentToCopy);
                      setCopiedReport(true);
                      setTimeout(() => setCopiedReport(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1f1f23] text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-[#232328]"
                  >
                    {copiedReport ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedReport ? "Copied" : "Copy Canvas"}</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreenCanvas(!isFullscreenCanvas)}
                    className="p-1.5 rounded-lg bg-[#141417] hover:bg-[#1f1f23] text-zinc-400 hover:text-white transition-colors border border-[#232328]"
                    title={isFullscreenCanvas ? "Exit Fullscreen" : "Fullscreen View"}
                  >
                    {isFullscreenCanvas ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Main Canvas Document Viewer */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin bg-[#0b0b0e]">
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {(activeArtifact || currentTask.report) ? (
                    <div className="p-6 md:p-8 rounded-2xl bg-[#121215] border border-[#232328] space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-[#232328] pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-violet-400" />
                          <h3 className="text-sm font-bold text-white">
                            {activeArtifact ? activeArtifact.title : "Agent Response & Workspace Findings"}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {activeArtifact ? activeArtifact.createdAt : ""}
                        </span>
                      </div>

                      <div className="text-xs md:text-sm leading-relaxed text-zinc-200 font-sans overflow-x-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-lg md:text-xl font-bold my-4 text-white border-b border-[#232328] pb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base md:text-lg font-semibold my-3 text-white border-b border-[#232328] pb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm md:text-base font-semibold my-2.5 text-violet-300">{children}</h3>,
                            p: ({ children }) => <p className="mb-3 leading-relaxed text-zinc-300">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-zinc-300">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-zinc-300">{children}</ol>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4 rounded-xl border border-[#232328]">
                                <table className="w-full text-left border-collapse text-xs">{children}</table>
                              </div>
                            ),
                            th: ({ children }) => <th className="bg-[#18181c] p-2.5 font-bold border-b border-[#232328] text-white">{children}</th>,
                            td: ({ children }) => <td className="p-2.5 border-b border-[#1f1f23] text-zinc-300">{children}</td>,
                            code: ({ children, ...props }) => (
                              <code className="bg-[#09090b] border border-[#232328] rounded px-1.5 py-0.5 text-xs font-mono text-violet-300" {...props}>
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-[#09090b] border border-[#232328] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono text-zinc-200 shadow-inner">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {activeArtifact ? activeArtifact.content : currentTask.report || ""}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-zinc-500 space-y-2 border border-dashed border-[#232328] rounded-2xl">
                      <RefreshCw size={24} className="animate-spin text-violet-400" />
                      <span className="text-xs font-mono">Agent is executing workspace steps & generating artifacts...</span>
                    </div>
                  )}

                </div>
              </div>

            </section>

          </div>
        )}

      </div>

      {/* ── TOOL LOG INSPECTOR MODAL ── */}
      {selectedLogItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[#232328] pb-3">
              <div className="flex items-center gap-2.5">
                <Terminal size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">{selectedLogItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedLogItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f1f23] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#09090b] p-3 rounded-xl border border-[#232328]">
                <div><span className="text-zinc-500 font-mono">Category:</span> <span className="font-semibold text-white uppercase">{selectedLogItem.category || "system"}</span></div>
                <div><span className="text-zinc-500 font-mono">Timestamp:</span> <span className="font-semibold text-white">{selectedLogItem.timestamp}</span></div>
                <div><span className="text-zinc-500 font-mono">Tool Name:</span> <span className="font-semibold text-violet-400">{selectedLogItem.toolName || "N/A"}</span></div>
                <div><span className="text-zinc-500 font-mono">Event Type:</span> <span className="font-semibold text-emerald-400 uppercase">{selectedLogItem.type}</span></div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Event Description</div>
                <div className="bg-[#09090b] p-3 rounded-xl border border-[#232328] text-zinc-300 font-mono text-xs">
                  {selectedLogItem.description}
                </div>
              </div>

              {selectedLogItem.query && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Tool Query Input</div>
                  <div className="bg-[#09090b] p-3 rounded-xl border border-[#232328] text-violet-300 font-mono text-xs">
                    {selectedLogItem.query}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogItem(null)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCP Dashboard Modal */}
      {showMCPDashboardModal && (
        <MCPDashboardModal isOpen={showMCPDashboardModal} onClose={() => setShowMCPDashboardModal(false)} />
      )}

    </div>
  );
}
