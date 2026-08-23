"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Github,
  HardDrive,
  Calendar,
  Mail,
  FileSpreadsheet,
  Plug,
  Globe,
  FileText,
  Play,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronRight,
  X,
  Send,
  AlertCircle,
  Loader2,
  Circle,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import IntegrationsModal from "@/components/IntegrationsModal";
import MermaidViewer, { isDiagramCode } from "@/components/MermaidViewer";

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
  category?: string;
  title: string;
  description: string;
  toolName?: string;
}

interface PendingApproval {
  toolName: string;
  category: string;
  params: any;
  title: string;
  description: string;
  targetResource: string;
}

interface Artifact {
  id: string;
  title: string;
  type: string;
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

// ─── Tool colors ──────────────────────────────────────────────────────────────
const TOOL_COLOR: Record<string, string> = {
  github: "text-zinc-300",
  drive: "text-zinc-300",
  calendar: "text-zinc-300",
  gmail: "text-zinc-300",
  sheets: "text-zinc-300",
  mcp: "text-zinc-300",
  browser: "text-zinc-300",
  system: "text-zinc-500",
};

const TOOL_DOT: Record<string, string> = {
  github: "bg-violet-400",
  drive: "bg-blue-400",
  calendar: "bg-pink-400",
  gmail: "bg-red-400",
  sheets: "bg-emerald-400",
  mcp: "bg-amber-400",
  browser: "bg-sky-400",
  system: "bg-zinc-500",
};

const INTEGRATION_ICON: Record<string, any> = {
  github: Github,
  drive: HardDrive,
  calendar: Calendar,
  gmail: Mail,
  sheets: FileSpreadsheet,
  mcp: Plug,
  browser: Globe,
};

// ─── Step icon ────────────────────────────────────────────────────────────────
function StepIcon({ status }: { status: PlanStep["status"] }) {
  if (status === "completed")
    return <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />;
  if (status === "running")
    return <Loader2 size={14} className="text-violet-400 animate-spin flex-shrink-0" />;
  if (status === "approval_required")
    return <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />;
  if (status === "failed")
    return <XCircle size={14} className="text-red-400 flex-shrink-0" />;
  return <Circle size={14} className="text-zinc-700 flex-shrink-0" />;
}

// ─── Log dot ──────────────────────────────────────────────────────────────────
function LogDot({ type, category }: { type: string; category?: string }) {
  if (type === "error") return <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />;
  if (type === "success") return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />;
  if (type === "approval_request") return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />;
  const dot = category ? (TOOL_DOT[category] || "bg-zinc-500") : "bg-zinc-500";
  return <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0 mt-1.5`} />;
}

function MermaidToSvg({ code }: { code: string }) {
  return <MermaidViewer code={code} />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CoworkPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [recentTasks, setRecentTasks] = useState<CoworkTask[]>([]);
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [followupInput, setFollowupInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowupSubmitting, setIsFollowupSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  // ── Visualize states
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [activeTab, setActiveTab] = useState<"task" | "visualize">("task");
  const [scale, setVisZoom] = useState(1);
  const [position, setVisPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [krokiUrls, setKrokiUrls] = useState<{ url: string; pngUrl: string } | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  // ── Initial load
  useEffect(() => {
    fetchStatus();
    fetchHistory();
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/cowork/github/repos");
      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.repos) {
          setRepos(data.repos);
          if (data.repos.length > 0) {
            setSelectedRepo(data.repos[0].full_name);
          }
        }
      }
    } catch {}
  };

  // Resolve Kroki SVG/PNG rendering URLs when visualization artifact is selected
  useEffect(() => {
    if (activeArtifact?.type === "visualization") {
      fetch("/api/cowork/kroki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: activeArtifact.content }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.url) setKrokiUrls(data);
        })
        .catch(() => {});
    } else {
      setKrokiUrls(null);
    }
    setVisZoom(1);
    setVisPan({ x: 0, y: 0 });
  }, [activeArtifact?.id]);

  // ── Polling
  useEffect(() => {
    if (currentTask && (currentTask.status === "running" || currentTask.status === "waiting_approval")) {
      pollRef.current = setInterval(async () => {
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
                if (pollRef.current) clearInterval(pollRef.current);
                fetchHistory();
                if (data.task.artifacts?.length > 0) {
                  setActiveArtifact(data.task.artifacts[0]);
                }
              }
            }
          }
        } catch {}
      }, 800);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentTask?.id, currentTask?.status]);

  // ── Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [currentTask?.activityFeed?.length]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/cowork/status");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/cowork/history");
      if (res.ok) {
        const data = await res.json();
        setRecentTasks(data.tasks || []);
      }
    } catch {}
  };

  const handleStartTask = async (preset?: string, isVis = false) => {
    const prompt = preset || promptInput;
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setActiveArtifact(null);

    try {
      const res = await fetch("/api/cowork/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt.trim(), 
          repoName: selectedRepo, 
          branch: "main",
          isVisualization: isVis 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setCurrentTask(data.task);
      setPromptInput("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowup = async () => {
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
        if (data.task.artifacts?.length > 0) setActiveArtifact(data.task.artifacts[0]);
      }
    } catch {}
    finally { setIsFollowupSubmitting(false); }
  };

  const handleApprove = async () => {
    if (!currentTask) return;
    try {
      const res = await fetch(`/api/cowork/tasks/${currentTask.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.task) setCurrentTask(data.task);
    } catch {}
  };

  const handleCancel = async () => {
    if (!currentTask) return;
    try {
      const res = await fetch(`/api/cowork/tasks/${currentTask.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.task) setCurrentTask(data.task);
    } catch {}
  };

  const PRESETS = [
    "Visualize the login flow",
    "Show me the database relationships",
    "What is my first repo?",
    "Summarize my GitHub repositories",
  ];

  const connectedCount = integrations.filter((i) => i.connected).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0a] text-zinc-100 flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Integrations Modal */}
      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        integrations={integrations}
        onStatusChange={fetchStatus}
      />

      {/* ── HEADER ── */}
      <header className="h-12 px-4 bg-[#0a0a0a] border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            <ArrowLeft size={15} />
            <span className="font-medium">Back</span>
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-sm font-semibold text-zinc-200">CoWork</span>
          <span className="text-[11px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">Agentic</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Repository Selector Dropdown */}
          {repos.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs">
              <span className="text-zinc-500 font-medium select-none">Repo:</span>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer pr-1 text-[11px] font-semibold max-w-[160px] truncate"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.full_name} className="bg-zinc-950 text-zinc-300">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Integration status button */}
          <button
            onClick={() => setShowIntegrationsModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all text-xs text-zinc-300"
            title="Manage Integrations"
          >
            <div className="flex items-center gap-1">
              {integrations.map((item) => {
                const Icon = INTEGRATION_ICON[item.id] || Globe;
                return (
                  <span
                    key={item.id}
                    className={`p-0.5 ${item.connected ? "text-zinc-300" : "text-zinc-700"}`}
                  >
                    <Icon size={13} />
                  </span>
                );
              })}
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              {connectedCount} Connected
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[220px] border-r border-zinc-900 flex flex-col h-full flex-shrink-0 bg-[#0a0a0a]">
          <div className="p-3 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">History</span>
            <button
              onClick={() => { setCurrentTask(null); setActiveArtifact(null); }}
              className="text-[11px] flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-900"
            >
              <Plus size={11} /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {recentTasks.length === 0 && (
              <p className="text-[11px] text-zinc-600 px-3 py-4">No tasks yet</p>
            )}
            {recentTasks.slice(0, 15).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTask(t);
                  if (t.artifacts?.length > 0) setActiveArtifact(t.artifacts[0]);
                  else setActiveArtifact(null);
                }}
                className={`w-full text-left px-3 py-2.5 transition-colors group ${
                  currentTask?.id === t.id ? "bg-zinc-900 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300"
                }`}
              >
                <div className="text-[12px] font-medium truncate leading-snug">{t.userQuery}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] ${
                    t.status === "completed" ? "text-emerald-500" :
                    t.status === "running" ? "text-violet-400" :
                    t.status === "failed" ? "text-red-500" : "text-zinc-600"
                  }`}>{t.status}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Artifacts in sidebar */}
          {currentTask?.artifacts && currentTask.artifacts.length > 1 && (
            <div className="border-t border-zinc-900 py-2">
              <div className="px-3 py-1.5 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Artifacts</div>
              {currentTask.artifacts.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setActiveArtifact(art)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[12px] transition-colors ${
                    activeArtifact?.id === art.id ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <FileText size={12} className="flex-shrink-0" />
                  <span className="truncate">{art.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── LANDING: No task selected ── */}
        {!currentTask && (
          <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] overflow-y-auto">
            <div className="w-full max-w-xl space-y-8 py-6">

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">What do you want to accomplish?</h1>
                <p className="text-sm text-zinc-500">
                  CoWork runs tasks across your connected tools — GitHub, Google Drive, Gmail, Calendar, and live web search. Ask to visualize your code, database, or API flows to generate diagrams.
                </p>
              </div>

              {/* Input */}
              <div className="relative">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartTask();
                    }
                  }}
                  placeholder="Describe a task or ask to visualize something (e.g. 'Visualize the login flow')"
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none resize-none transition-colors"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => handleStartTask()}
                    disabled={!promptInput.trim() || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                    Run
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Try</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleStartTask(p)}
                      className="text-left px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-between group"
                    >
                      <span>{p}</span>
                      <span className="text-[10px] text-zinc-700 group-hover:text-zinc-400 transition-colors">→</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Integration status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Integrations</p>
                  <button
                    onClick={() => setShowIntegrationsModal(true)}
                    className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
                  >
                    Manage / Disconnect
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {integrations.map((item) => {
                    const Icon = INTEGRATION_ICON[item.id] || Globe;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setShowIntegrationsModal(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          item.connected
                            ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                            : "border-zinc-900 text-zinc-600 hover:border-zinc-800 hover:text-zinc-400"
                        }`}
                      >
                        <Icon size={13} />
                        <span>{item.name}</span>
                        {item.connected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="text-[10px] text-zinc-600">Connect</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ── ACTIVE WORKSPACE ── */}
        {currentTask && (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">

            {/* ── LEFT: Steps + Logs ── */}
            <section className="w-[300px] flex-shrink-0 border-r border-zinc-900 flex flex-col h-full bg-[#0a0a0a]">

              {/* Task header */}
              <div className="px-4 py-3 border-b border-zinc-900 flex-shrink-0">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1">Current task</p>
                <p className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">{currentTask.userQuery}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-[10px] font-medium ${
                    currentTask.status === "completed" ? "text-emerald-500" :
                    currentTask.status === "running" ? "text-violet-400" :
                    currentTask.status === "failed" ? "text-red-400" :
                    currentTask.status === "waiting_approval" ? "text-amber-400" :
                    "text-zinc-600"
                  }`}>
                    {currentTask.status === "running" && "Running"}
                    {currentTask.status === "completed" && "Completed"}
                    {currentTask.status === "failed" && "Failed"}
                    {currentTask.status === "cancelled" && "Cancelled"}
                    {currentTask.status === "waiting_approval" && "Awaiting approval"}
                  </span>
                  {currentTask.status === "running" && <Loader2 size={10} className="text-violet-400 animate-spin" />}
                </div>
              </div>

              {/* Steps */}
              <div className="px-4 py-3 border-b border-zinc-900 flex-shrink-0 space-y-2">
                {currentTask.plan.map((step) => (
                  <div key={step.id} className="flex items-center gap-2.5">
                    <StepIcon status={step.status} />
                    <span className={`text-[12px] ${
                      step.status === "completed" ? "text-zinc-400" :
                      step.status === "running" ? "text-zinc-100 font-medium" :
                      step.status === "failed" ? "text-red-400" :
                      "text-zinc-700"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Approval card */}
              {currentTask.pendingApproval && (
                <div className="mx-4 my-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={13} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">Approval required</span>
                  </div>
                  <p className="text-[12px] text-zinc-400 mb-3">{currentTask.pendingApproval.description}</p>
                  <div className="flex gap-2">
                    <button onClick={handleCancel} className="flex-1 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleApprove} className="flex-1 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-xs text-zinc-900 font-semibold transition-colors">
                      Approve
                    </button>
                  </div>
                </div>
              )}

              {/* Activity log */}
              <div ref={logScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {currentTask.activityFeed.length === 0 && (
                  <p className="text-[11px] text-zinc-700">Starting...</p>
                )}
                {currentTask.activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <LogDot type={item.type} category={item.category} />
                    <div className="min-w-0">
                      <span className={`text-[12px] ${TOOL_COLOR[item.category || "system"] || "text-zinc-400"}`}>
                        {item.title}
                      </span>
                      {item.description && (
                        <p className="text-[11px] text-zinc-600 truncate mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {currentTask.status === "running" && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 animate-pulse" />
                    <span className="text-[11px] text-zinc-700">Working...</span>
                  </div>
                )}
              </div>

              {/* Follow-up input */}
              <div className="px-3 py-3 border-t border-zinc-900 flex-shrink-0">
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 focus-within:border-zinc-700 rounded-lg px-3 py-2 transition-colors">
                  <input
                    type="text"
                    value={followupInput}
                    onChange={(e) => setFollowupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowup(); }
                    }}
                    placeholder="Follow up..."
                    disabled={isFollowupSubmitting || currentTask.status === "running"}
                    className="flex-1 bg-transparent text-[12px] text-zinc-300 placeholder-zinc-700 outline-none"
                  />
                  <button
                    onClick={handleFollowup}
                    disabled={!followupInput.trim() || isFollowupSubmitting || currentTask.status === "running"}
                    className="text-zinc-600 hover:text-zinc-300 disabled:opacity-30 transition-colors"
                  >
                    {isFollowupSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
              </div>
            </section>

            {/* ── RIGHT: Canvas ── */}
            <section className="flex-1 flex flex-col h-full min-w-0 bg-[#0a0a0a]">

              {/* Canvas header */}
              <div className="h-12 px-4 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {currentTask.artifacts && currentTask.artifacts.length > 0 ? (
                    currentTask.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => setActiveArtifact(art)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                          activeArtifact?.id === art.id
                            ? "bg-zinc-900 text-zinc-100"
                            : "text-zinc-600 hover:text-zinc-300"
                        }`}
                      >
                        <FileText size={12} />
                        {art.title.slice(0, 30)}
                      </button>
                    ))
                  ) : (
                    <span className="text-[12px] text-zinc-600">Canvas</span>
                  )}
                </div>

                {(activeArtifact || currentTask.report) && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeArtifact?.content || currentTask.report || "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {/* Canvas body */}
              <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                {activeArtifact?.type === "visualization" ? (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0a0a0b] relative">
                    <MermaidViewer
                      code={activeArtifact.content}
                      title={activeArtifact.title || "Visual Diagram"}
                      className="flex-1 h-full rounded-none border-0 my-0"
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto w-full h-full">
                    {(activeArtifact || currentTask.report) ? (
                      <div className="max-w-3xl mx-auto px-8 py-10">
                        <div className="max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold text-zinc-100 mb-4 mt-8 first:mt-0 pb-2 border-b border-zinc-800">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-semibold text-zinc-100 mt-7 mb-3 first:mt-0">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">{children}</h3>
                              ),
                              p: ({ children }) => (
                                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="space-y-1.5 mb-4 pl-4">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="space-y-1.5 mb-4 pl-4 list-decimal">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-zinc-400 leading-relaxed ml-4 list-disc">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-zinc-200">{children}</strong>
                              ),
                               code: ({ children, className, ...props }: any) => {
                                 const codeString = String(children || "").trim();
                                 const isDiagram = isDiagramCode(className, codeString);

                                 if (!props.inline && isDiagram) {
                                   return <MermaidToSvg code={codeString} />;
                                 }

                                 return props.inline ? (
                                   <code className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[12px] font-mono text-violet-300">
                                     {children}
                                   </code>
                                 ) : (
                                   <code className="text-[12px] font-mono text-zinc-300">{children}</code>
                                 );
                               },
                               pre: ({ children }: any) => {
                                 const childCode = String(children?.props?.children || "").trim();
                                 const childClass = children?.props?.className || "";
                                 if (isDiagramCode(childClass, childCode)) {
                                   return <>{children}</>;
                                 }
                                 return (
                                   <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-[12px] font-mono text-zinc-300 my-4">
                                     {children}
                                   </pre>
                                 );
                               },
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-5 rounded-lg border border-zinc-800">
                                  <table className="w-full text-sm text-left">{children}</table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="px-4 py-2.5 text-[12px] font-semibold text-zinc-300 bg-zinc-900 border-b border-zinc-800">{children}</th>
                              ),
                              td: ({ children }) => (
                                <td className="px-4 py-2.5 text-[12px] text-zinc-400 border-b border-zinc-900">{children}</td>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-zinc-700 pl-4 my-4 text-zinc-500 italic">{children}</blockquote>
                              ),
                              a: ({ children, href }) => {
                                if (href?.startsWith("https://kroki.io/")) {
                                  return (
                                    <div className="my-4 p-2 bg-[#070707] border border-zinc-800 rounded-lg overflow-hidden flex flex-col items-center gap-2">
                                      <img src={href} alt="Rendered Diagram" className="max-w-full max-h-[350px] object-contain" />
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline">
                                        Open in new tab
                                      </a>
                                    </div>
                                  );
                                }
                                return (
                                  <a href={href} target="_blank" rel="noopener" className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">
                                    {children}
                                  </a>
                                );
                              },
                              hr: () => <hr className="border-zinc-800 my-6" />,
                            }}
                          >
                            {activeArtifact ? activeArtifact.content : currentTask.report || ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                        {currentTask.status === "running" ? (
                          <>
                            <Loader2 size={20} className="text-zinc-700 animate-spin" />
                            <p className="text-sm text-zinc-600">Running task...</p>
                          </>
                        ) : currentTask.status === "failed" ? (
                          <>
                            <XCircle size={20} className="text-red-500" />
                            <p className="text-sm text-zinc-500">Task failed. Check your integrations and try again.</p>
                          </>
                        ) : (
                          <>
                            <FileText size={20} className="text-zinc-800" />
                            <p className="text-sm text-zinc-600">No output yet</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </section>
          </div>
        )}
      </div>
    </div>
  );
}
