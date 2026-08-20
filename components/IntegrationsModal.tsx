"use client";

import { useState } from "react";
import {
  X,
  Github,
  HardDrive,
  Calendar,
  Mail,
  FileSpreadsheet,
  Plug,
  Globe,
  CheckCircle2,
  XCircle,
  KeyRound,
  User,
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export interface IntegrationItem {
  id: string;
  name: string;
  connected: boolean;
  username?: string | null;
  details?: string;
}

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: IntegrationItem[];
  onStatusChange: () => void;
}

export default function IntegrationsModal({
  isOpen,
  onClose,
  integrations,
  onStatusChange,
}: IntegrationsModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>("github");
  const [githubUser, setGithubUser] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const githubIntegration = integrations.find((i) => i.id === "github");
  const googleIntegration = integrations.find((i) => ["drive", "gmail", "calendar", "sheets"].includes(i.id));

  const handleDisconnectGitHub = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "GitHub account disconnected successfully!" });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to disconnect GitHub" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to disconnect" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: githubUser.trim() || undefined,
          token: githubToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "GitHub connected successfully!" });
        setGithubToken("");
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to connect GitHub" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Connection error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Google services disconnected successfully!" });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to disconnect Google" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to disconnect" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Integration Manager</h2>
            <p className="text-xs text-zinc-500">Connect or disconnect tools for your CoWork agent</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 min-h-[360px]">
          
          {/* Tabs Sidebar */}
          <div className="w-48 border-r border-zinc-800/80 p-3 space-y-1 bg-zinc-950/40">
            <button
              onClick={() => { setSelectedTab("github"); setMessage(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedTab === "github"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Github size={15} className="text-violet-400" />
                <span>GitHub</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${githubIntegration?.connected ? "bg-emerald-400" : "bg-zinc-700"}`} />
            </button>

            <button
              onClick={() => { setSelectedTab("google"); setMessage(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedTab === "google"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-blue-400" />
                <span>Google Suite</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${googleIntegration?.connected ? "bg-emerald-400" : "bg-zinc-700"}`} />
            </button>

            <button
              onClick={() => { setSelectedTab("mcp"); setMessage(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedTab === "mcp"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Plug size={15} className="text-amber-400" />
                <span>MCP Servers</span>
              </div>
              <span className="text-[10px] text-zinc-500">Config</span>
            </button>

            <button
              onClick={() => { setSelectedTab("browser"); setMessage(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                selectedTab === "browser"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-sky-400" />
                <span>Live Search</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            {message && (
              <div
                className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                    : "bg-red-950/40 text-red-300 border border-red-800/40"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                <span>{message.text}</span>
              </div>
            )}

            {/* GitHub Tab */}
            {selectedTab === "github" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Github size={16} /> GitHub Integration
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Enables the agent to inspect repos, commits, branches, issues, and codebases.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      githubIntegration?.connected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${githubIntegration?.connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    {githubIntegration?.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {githubIntegration?.connected && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Account</div>
                      <div className="text-sm font-medium text-zinc-200">@{githubIntegration.username || "Connected"}</div>
                    </div>
                    <button
                      onClick={handleDisconnectGitHub}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 text-red-300 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Disconnect
                    </button>
                  </div>
                )}

                <form onSubmit={handleConnectGitHub} className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <User size={13} className="text-zinc-500" />
                      GitHub Username / Account
                    </label>
                    <input
                      type="text"
                      value={githubUser}
                      onChange={(e) => setGithubUser(e.target.value)}
                      placeholder={githubIntegration?.username || "e.g. ShivamSk07"}
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <KeyRound size={13} className="text-zinc-500" />
                      Personal Access Token (PAT) <span className="text-zinc-500 text-[10px]">(Optional - for private repos)</span>
                    </label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      {githubIntegration?.connected ? "Update Account" : "Connect GitHub"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Google Suite Tab */}
            {selectedTab === "google" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <HardDrive size={16} className="text-blue-400" /> Google Workspace Suite
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Controls Drive Docs, Gmail search/drafting, Calendar scheduling, and Sheets access.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      googleIntegration?.connected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${googleIntegration?.connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    {googleIntegration?.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {googleIntegration?.connected && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Google Account</div>
                      <div className="text-sm font-medium text-zinc-200">{googleIntegration.username || "Connected"}</div>
                    </div>
                    <button
                      onClick={handleDisconnectGoogle}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 text-red-300 text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Disconnect
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex items-center gap-2">
                    <HardDrive size={14} className="text-blue-400" />
                    <span>Google Drive</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex items-center gap-2">
                    <Mail size={14} className="text-red-400" />
                    <span>Gmail Inbox</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex items-center gap-2">
                    <Calendar size={14} className="text-pink-400" />
                    <span>Google Calendar</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-emerald-400" />
                    <span>Google Sheets</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => { window.location.href = "/api/auth/google"; }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                  >
                    <ExternalLink size={13} />
                    Connect Google Account
                  </button>
                </div>
              </div>
            )}

            {/* MCP Tab */}
            {selectedTab === "mcp" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Plug size={16} className="text-amber-400" /> Model Context Protocol (MCP)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Connect custom local or remote MCP servers to expose tools directly to CoWork.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p>MCP servers can be mentioned inside any CoWork prompt using the <code className="text-amber-300 font-mono">@servername</code> syntax.</p>
                  <p className="text-zinc-500">Supports stdio and HTTP/SSE MCP endpoints.</p>
                </div>
              </div>
            )}

            {/* Live Search Tab */}
            {selectedTab === "browser" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Globe size={16} className="text-sky-400" /> Live Web Search
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Performs real-time web lookups for latest news, external documentation, and internet facts.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Always Ready
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p>Web search is automatically routed only when you ask about live internet information or explicitly request a search, avoiding redundant search overhead on GitHub/local queries.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>Changes take effect immediately</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
