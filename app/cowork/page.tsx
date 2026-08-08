"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Github,
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
  ChevronDown,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Terminal,
  UserCheck,
  Lock,
  Plus,
  Shield,
  Layers,
  Code2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RepoItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  updated_at: string;
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
  title: string;
  description: string;
  toolName?: string;
  query?: string;
  details?: any;
}

interface PendingApproval {
  toolName: string;
  params: any;
  title: string;
  description: string;
  repository: string;
}

interface Artifact {
  id: string;
  title: string;
  type: "security" | "review" | "architecture" | "checklist" | "plan";
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
  prReviewScore: {
    overall: number;
    critical: number;
    high: number;
    medium: number;
    suggestions: number;
  } | null;
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
}

export default function CoworkPage() {
  const router = useRouter();

  // GitHub Connection State
  const [isGitHubConnected, setIsGitHubConnected] = useState(true);
  const [githubUser, setGithubUser] = useState({
    username: "ShivamSk07",
    displayName: "Shivam Kothekar",
    avatarUrl: "https://github.com/ShivamSk07.png",
  });
  const [showManageGitHubModal, setShowManageGitHubModal] = useState(false);

  // Repositories List & Selection State
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoItem | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  // Workspace Nav State (Left Sidebar)
  const [workspaceNav, setWorkspaceNav] = useState<"overview" | "files" | "issues" | "prs" | "branches" | "artifacts">("overview");

  // Agent Task Execution State
  const [currentTask, setCurrentTask] = useState<CoworkTask | null>(null);
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Artifact State
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch GitHub Connection Status & Repositories
  useEffect(() => {
    fetchGitHubStatus();
    fetchRepositories();
  }, []);

  const fetchGitHubStatus = async () => {
    try {
      const res = await fetch("/api/cowork/github/status");
      if (res.ok) {
        const data = await res.json();
        setIsGitHubConnected(data.connected);
        if (data.username) {
          setGithubUser({
            username: data.username,
            displayName: data.displayName || data.username,
            avatarUrl: data.avatarUrl || "https://github.com/ShivamSk07.png",
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch GitHub status", e);
    }
  };

  const fetchRepositories = async () => {
    try {
      const res = await fetch("/api/cowork/github/repos");
      if (res.ok) {
        const data = await res.json();
        const list = data.repos || [];
        setRepos(list);
        if (list.length > 0 && !selectedRepo) {
          setSelectedRepo(list[0]);
          setSelectedBranch(list[0].default_branch || "main");
        }
      }
    } catch (e) {
      console.error("Failed to fetch repositories", e);
    }
  };

  // 2. Task Execution Polling Loop
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
              if (data.task.status === "completed" || data.task.status === "failed" || data.task.status === "cancelled") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
          repoName: selectedRepo ? selectedRepo.full_name : "ShivamSk07/Mindmate",
          branch: selectedBranch,
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

  // 4. Human Approval Handlers
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
      console.error("Approve action failed", e);
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
      console.error("Cancel action failed", e);
    }
  };

  const handleToggleGitHubConnect = async (action: "connect" | "disconnect") => {
    try {
      const res = await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setIsGitHubConnected(data.connected);
      setShowManageGitHubModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(repoSearchQuery.toLowerCase()))
  );

  const SUGGESTED_PROMPTS = [
    "Audit my repository",
    "Review my latest PR",
    "Find security issues",
    "Explain this codebase",
    "Find technical debt",
    "Prepare my project for launch",
  ];

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
          <span className="text-xs font-mono text-[#8e8e93]">GPT-OSS 120B Agent</span>
        </div>

        {/* GitHub Connection Badge */}
        <div className="flex items-center gap-3">
          {isGitHubConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white font-medium">GitHub ● Connected</span>
              <span className="text-[#8e8e93] font-mono text-[11px]">({githubUser.username})</span>
              <button
                onClick={() => setShowManageGitHubModal(true)}
                className="ml-1 text-[11px] text-[#a1a1aa] hover:text-white underline underline-offset-2 transition-colors"
              >
                Manage
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleToggleGitHubConnect("connect")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-[#e5e5ea] transition-all"
            >
              <Github size={14} />
              <span>Connect GitHub</span>
            </button>
          )}

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

        {/* ── COLUMN 1: LEFT SIDEBAR (PROJECT CONTEXT) ── */}
        <aside className="w-[280px] bg-[#111113] border-r border-[#222226] flex flex-col h-full flex-shrink-0">
          
          {/* Active Repository Card */}
          <div className="p-4 border-b border-[#222226] space-y-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
              <span>Project</span>
              <button
                onClick={() => setShowRepoModal(true)}
                className="text-[10px] text-[#a1a1aa] hover:text-white transition-colors"
              >
                Switch Repo
              </button>
            </div>

            {selectedRepo ? (
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-3 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Github size={15} className="text-white flex-shrink-0" />
                    <span className="text-xs font-semibold text-white truncate">{selectedRepo.name}</span>
                  </div>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-[#2c2c2e] text-[#a1a1aa] rounded">
                    {selectedRepo.default_branch}
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed">
                  {selectedRepo.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#636366] font-mono">
                  <span>{selectedRepo.language || "TypeScript"}</span>
                  <span>★ {selectedRepo.stargazers_count}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRepoModal(true)}
                className="w-full bg-[#1c1c1e] border border-dashed border-[#2c2c2e] hover:border-[#3a3a3c] rounded-xl p-3 text-center text-xs text-[#8e8e93] hover:text-white transition-all"
              >
                Select a GitHub repository...
              </button>
            )}
          </div>

          {/* Workspace Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="space-y-1">
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
                onClick={() => setWorkspaceNav("files")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  workspaceNav === "files"
                    ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                    : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
                }`}
              >
                <FolderTree size={14} />
                <span>Files</span>
              </button>

              <button
                onClick={() => setWorkspaceNav("issues")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  workspaceNav === "issues"
                    ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                    : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
                }`}
              >
                <AlertCircle size={14} />
                <span>Issues</span>
                {selectedRepo?.open_issues_count ? (
                  <span className="ml-auto px-1.5 py-0.2 text-[9px] font-mono bg-[#2c2c2e] text-[#a1a1aa] rounded-full">
                    {selectedRepo.open_issues_count}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setWorkspaceNav("prs")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  workspaceNav === "prs"
                    ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                    : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
                }`}
              >
                <GitPullRequest size={14} />
                <span>Pull Requests</span>
              </button>

              <button
                onClick={() => setWorkspaceNav("branches")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  workspaceNav === "branches"
                    ? "bg-[#1c1c1e] text-white border border-[#2c2c2e]"
                    : "text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]/50"
                }`}
              >
                <GitBranch size={14} />
                <span>Branches</span>
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
                <span>Artifacts</span>
                {currentTask?.artifacts?.length ? (
                  <span className="ml-auto px-1.5 py-0.2 text-[9px] font-mono bg-[#2c2c2e] text-white rounded-full">
                    {currentTask.artifacts.length}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Generated Artifacts List */}
            {currentTask?.artifacts && currentTask.artifacts.length > 0 && (
              <div className="pt-2 border-t border-[#222226] space-y-2">
                <span className="block px-2 text-[10px] font-semibold uppercase tracking-wider text-[#8e8e93]">
                  Project Artifacts
                </span>
                {currentTask.artifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setActiveArtifact(art)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeArtifact?.id === art.id
                        ? "bg-[#1c1c1e] border-white text-white shadow-sm"
                        : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e]"
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

          {/* GitHub Account Footer */}
          <div className="p-4 border-t border-[#222226] bg-[#111113] flex items-center justify-between text-xs text-[#8e8e93]">
            <div className="flex items-center gap-2">
              <img src={githubUser.avatarUrl} alt="github avatar" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-white font-medium font-mono text-[11px]">@{githubUser.username}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">OAuth Active</span>
          </div>
        </aside>

        {/* ── COLUMN 2: CENTER COLUMN (AGENT WORKSPACE) ── */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#000000] relative">
          
          {/* Subheader Toolbar */}
          <div className="h-12 px-6 bg-[#111113]/60 border-b border-[#222226] flex items-center justify-between flex-shrink-0 text-xs text-[#8e8e93]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {selectedRepo ? selectedRepo.full_name : "ShivamSk07/Mindmate"}
              </span>
              <span>/</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-md px-2 py-0.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="main">main</option>
                <option value="feature/cowork-v2">feature/cowork-v2</option>
              </select>
            </div>

            {currentTask && (
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Task Status:</span>
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

              {/* 1. DYNAMIC AGENT EXECUTION PLAN */}
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
                          step.status === "completed" ? "text-white line-through opacity-80" :
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

              {/* 2. REPOSITORY HEALTH SCORES WIDGET */}
              {currentTask?.scores && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Repository Health Score</h3>
                    <span className="text-sm font-bold font-mono text-white bg-[#2c2c2e] px-2.5 py-0.5 rounded-lg border border-[#3a3a3c]">
                      {currentTask.scores.overall} / 100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Security</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{currentTask.scores.security}/100</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Architecture</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">{currentTask.scores.architecture}/100</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Code Quality</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">{currentTask.scores.codeQuality}/100</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2.5 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Maintenance</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">{currentTask.scores.maintenance}/100</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CODE REVIEW SCORE CARD (IF PR REVIEW TASK) */}
              {currentTask?.prReviewScore && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Pull Request Review Score</h3>
                    <span className="text-sm font-bold font-mono text-white bg-[#2c2c2e] px-2.5 py-0.5 rounded-lg border border-[#3a3a3c]">
                      {currentTask.prReviewScore.overall} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Critical</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{currentTask.prReviewScore.critical}</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2 text-center">
                      <div className="text-[10px] text-[#8e8e93]">High</div>
                      <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{currentTask.prReviewScore.high}</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Medium</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{currentTask.prReviewScore.medium}</div>
                    </div>
                    <div className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-2 text-center">
                      <div className="text-[10px] text-[#8e8e93]">Suggestions</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{currentTask.prReviewScore.suggestions}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CODE DIFF VIEWER */}
              {currentTask?.codeDiff && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                      <Code2 size={14} /> Proposed Code Diff
                    </span>
                    <span className="text-[10px] font-mono text-[#8e8e93]">git diff</span>
                  </div>
                  <pre className="bg-[#111113] border border-[#2c2c2e] rounded-xl p-3.5 font-mono text-xs text-[#f2f2f7] overflow-x-auto leading-relaxed">
                    {currentTask.codeDiff}
                  </pre>
                </div>
              )}

              {/* 5. MAIN AI REPORT / ARTIFACT DISPLAY */}
              {(currentTask?.report || activeArtifact) && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-white" />
                      <h3 className="text-sm font-semibold text-white">
                        {activeArtifact ? activeArtifact.title : "Agent Analysis & Recommendations"}
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

              {/* DISCONNECTED GITHUB SCREEN */}
              {!isGitHubConnected && (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] mx-auto flex items-center justify-center p-3 shadow-md">
                    <Github size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">GitHub</h2>
                    <p className="text-xs text-[#8e8e93] leading-relaxed mt-1">
                      Connect your GitHub account to let Clarity work with your repositories.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleGitHubConnect("connect")}
                    className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5ea] active:scale-95 transition-all shadow-sm"
                  >
                    Connect GitHub
                  </button>
                </div>
              )}

              {/* WELCOME / EMPTY STATE FOR CENTER COLUMN */}
              {isGitHubConnected && !currentTask && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#1c1c1e] border border-[#2c2c2e] mx-auto flex items-center justify-center p-3">
                    <Github size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Clarity GitHub Agent Workspace</h2>
                  <p className="text-xs text-[#8e8e93] max-w-sm mx-auto">
                    Give Clarity a high-level goal to inspect, audit, or review your GitHub repositories.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* ── MAIN COMPOSER (BOTTOM INPUT) ── */}
          <div className="p-4 bg-[#111113] border-t border-[#222226] flex-shrink-0 z-10">
            <div className="max-w-3xl mx-auto space-y-3">
              
              {/* Suggestion Pills */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {SUGGESTED_PROMPTS.map((sug, idx) => (
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
                <Github size={16} className="text-[#8e8e93] flex-shrink-0" />
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
                  placeholder="What do you want Clarity to work on?"
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

        {/* ── COLUMN 3: RIGHT SIDEBAR (ACTIVITY FEED & HUMAN APPROVAL) ── */}
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
            
            {/* HUMAN APPROVAL CARD (SHOWN PROMINENTLY WHEN WRITE ACTION REQUIRES APPROVAL) */}
            {currentTask?.pendingApproval && (
              <div className="bg-[#1c1c1e] border-2 border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl animate-fade-in">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs border-b border-[#2c2c2e] pb-2">
                  <AlertCircle size={15} />
                  <span>Approval Required</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">{currentTask.pendingApproval.title}</div>
                  <div className="text-[10px] text-[#8e8e93] font-mono">
                    Repository: {currentTask.pendingApproval.repository}
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

            {/* STRUCTURED GITHUB ACTIVITY FEED */}
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
                          {act.type === "connect" && <UserCheck size={14} className="text-emerald-400 flex-shrink-0" />}
                          {act.type === "tool_call" && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                          {act.type === "reasoning" && <Sparkles size={14} className="text-blue-400 flex-shrink-0" />}
                          {act.type === "approval_request" && <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />}
                          {act.type === "success" && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                          {act.type === "error" && <XCircle size={14} className="text-red-400 flex-shrink-0" />}

                          <span className="text-xs font-medium text-white truncate">{act.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[#636366] flex-shrink-0">{act.timestamp}</span>
                      </div>

                      <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed">
                        {act.description}
                      </p>

                      {/* Expanded Tool Call Details */}
                      {isExpanded && act.toolName && (
                        <div className="mt-2 pt-2 border-t border-[#2c2c2e] font-mono text-[10px] text-[#a1a1aa] space-y-1 bg-[#111113] p-2 rounded-lg">
                          <div>Tool: <strong className="text-white">{act.toolName}</strong></div>
                          {act.query && <div>Query: "{act.query}"</div>}
                          {act.details && (
                            <pre className="text-[9px] overflow-x-auto text-[#8e8e93] pt-1">
                              {JSON.stringify(act.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-[11px] text-[#636366]">
                No GitHub activity events recorded yet. Start a task to view real-time tool calls.
              </div>
            )}

          </div>

          <div className="p-4 border-t border-[#222226] bg-[#111113] text-[10px] text-[#636366] font-mono text-center">
            GitHub REST API v3 • Token Encrypted
          </div>
        </aside>

      </div>

      {/* ── MODAL 1: REPOSITORY SELECTOR BROWSER ── */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <Github size={18} />
                <h3 className="text-sm font-semibold text-white">Select GitHub Repository</h3>
              </div>
              <button
                onClick={() => setShowRepoModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
              <input
                type="text"
                value={repoSearchQuery}
                onChange={(e) => setRepoSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="w-full pl-9 pr-3 py-2 bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
              {filteredRepos.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRepo(r);
                    setSelectedBranch(r.default_branch || "main");
                    setShowRepoModal(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedRepo?.id === r.id
                      ? "bg-[#2c2c2e] border-white text-white shadow-sm"
                      : "bg-[#111113] border-[#222226] text-[#8e8e93] hover:text-white hover:bg-[#2c2c2e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{r.name}</span>
                    <span className="text-[10px] font-mono text-[#8e8e93]">{r.default_branch}</span>
                  </div>
                  {r.description && <p className="text-[11px] text-[#8e8e93] truncate mt-1">{r.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MANAGE GITHUB CONNECTION ── */}
      {showManageGitHubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] p-6 shadow-2xl space-y-4 text-[#f2f2f7]">
            <div className="flex items-center justify-between border-b border-[#2c2c2e] pb-3">
              <div className="flex items-center gap-2">
                <Github size={18} />
                <h3 className="text-sm font-semibold text-white">GitHub Settings</h3>
              </div>
              <button
                onClick={() => setShowManageGitHubModal(false)}
                className="text-[#8e8e93] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#111113] border border-[#2c2c2e] rounded-xl">
              <img src={githubUser.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="text-xs font-semibold text-white">{githubUser.displayName}</div>
                <div className="text-[11px] text-[#8e8e93] font-mono">@{githubUser.username}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleToggleGitHubConnect("disconnect")}
                className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all"
              >
                Disconnect GitHub
              </button>
              <button
                onClick={() => setShowManageGitHubModal(false)}
                className="flex-1 py-2 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-semibold text-white transition-all"
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
