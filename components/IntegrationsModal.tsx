"use client";

import { useState } from "react";
import {
  X,
  Github,
  Linkedin,
  Triangle,
  Plug,
  Globe,
  Loader2,
  Check,
  AlertCircle,
  Key,
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [vercelTokenInput, setVercelTokenInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const githubIntegration = integrations.find((i) => i.id === "github");
  const linkedinIntegration = integrations.find((i) => i.id === "linkedin");
  const vercelIntegration = integrations.find((i) => i.id === "vercel");

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
        setMessage({ type: "success", text: "GitHub disconnected" });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to disconnect" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to disconnect" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/linkedin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "LinkedIn disconnected" });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to disconnect" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to disconnect" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectVercelToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vercelTokenInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/cowork/vercel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: vercelTokenInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.connected) {
        setMessage({ type: "success", text: data.message || "Vercel connected successfully" });
        setVercelTokenInput("");
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to connect Vercel token" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Connection failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnectVercel = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/vercel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Vercel disconnected" });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to disconnect" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to disconnect" });
    } finally {
      setIsProcessing(false);
    }
  };

  const INTEGRATION_TABS = [
    { id: "github", name: "GitHub", icon: Github, connected: !!githubIntegration?.connected },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, connected: !!linkedinIntegration?.connected },
    { id: "vercel", name: "Vercel", icon: Triangle, connected: !!vercelIntegration?.connected },
    { id: "mcp", name: "MCP Servers", icon: Plug, connected: false },
    { id: "browser", name: "Web Search", icon: Globe, connected: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-zinc-900 rounded-xl flex flex-col overflow-hidden text-zinc-200">
        <div className="h-12 px-4 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">Integrations</span>
            <span className="text-[11px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">Workspace</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-1 min-h-[330px]">
          <div className="w-44 border-r border-zinc-900 p-2 space-y-1 bg-[#0a0a0a] flex-shrink-0">
            {INTEGRATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedTab(tab.id);
                    setMessage(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-zinc-100 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={isSelected ? "text-zinc-200" : "text-zinc-500"} />
                    <span>{tab.name}</span>
                  </div>
                  {tab.connected ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-5 flex flex-col justify-between bg-[#0a0a0a]">
            <div>
              {message && (
                <div
                  className={`mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${
                    message.type === "success"
                      ? "bg-zinc-950 text-emerald-400 border-zinc-800"
                      : "bg-zinc-950 text-red-400 border-zinc-800"
                  }`}
                >
                  {message.type === "success" ? <Check size={13} /> : <AlertCircle size={13} />}
                  <span>{message.text}</span>
                </div>
              )}

              {selectedTab === "github" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Github size={15} className="text-zinc-200" />
                      <h3 className="text-xs font-semibold text-zinc-200">GitHub</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Allows CoWork to inspect repositories, codebase trees, commits, and issues.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              githubIntegration?.connected ? "bg-emerald-500" : "bg-zinc-700"
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-300">
                            {githubIntegration?.connected
                              ? `@${githubIntegration.username || "Connected"}`
                              : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      {githubIntegration?.connected ? (
                        <button
                          onClick={handleDisconnectGitHub}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { window.location.href = "/api/auth/github"; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                        >
                          <Github size={13} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "linkedin" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Linkedin size={15} className="text-[#0a66c2]" />
                      <h3 className="text-xs font-semibold text-zinc-200">LinkedIn</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Allows CoWork to publish updates, draft thought-leadership posts, and automate social growth.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              linkedinIntegration?.connected ? "bg-[#0a66c2]" : "bg-zinc-700"
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-300">
                            {linkedinIntegration?.connected
                              ? `@${linkedinIntegration.username || "Connected"}`
                              : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      {linkedinIntegration?.connected ? (
                        <button
                          onClick={handleDisconnectLinkedIn}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { window.location.href = "/api/auth/linkedin"; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-medium transition-colors shadow-sm"
                        >
                          <Linkedin size={13} />
                          <span>Connect LinkedIn</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "vercel" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Triangle size={15} className="text-zinc-100 fill-zinc-100" />
                      <h3 className="text-xs font-semibold text-zinc-200">Vercel</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Allows CoWork to 1-Click host and deploy generated static sites and GitHub repositories live to Vercel.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              vercelIntegration?.connected ? "bg-emerald-500" : "bg-zinc-700"
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-300">
                            {vercelIntegration?.connected
                              ? `@${vercelIntegration.username || "Connected"}`
                              : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      {vercelIntegration?.connected ? (
                        <button
                          onClick={handleDisconnectVercel}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { window.location.href = "/api/auth/vercel"; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                        >
                          <Triangle size={11} className="fill-zinc-950" />
                          <span>OAuth Connect</span>
                        </button>
                      )}
                    </div>

                    {!vercelIntegration?.connected && (
                      <div className="pt-3 border-t border-zinc-900">
                        <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mb-2">
                          <Key size={12} className="text-zinc-500" />
                          <span>Or connect with Personal Access Token:</span>
                        </p>
                        <form onSubmit={handleConnectVercelToken} className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Vercel Access Token (Account Settings > Tokens)"
                            value={vercelTokenInput}
                            onChange={(e) => setVercelTokenInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                          />
                          <button
                            type="submit"
                            disabled={!vercelTokenInput.trim() || isProcessing}
                            className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Connect"}
                          </button>
                        </form>
                        <a
                          href="https://vercel.com/account/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-1.5 transition-colors"
                        >
                          <span>Get token from Vercel Account Settings</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === "mcp" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plug size={15} className="text-zinc-200" />
                      <h3 className="text-xs font-semibold text-zinc-200">Model Context Protocol (MCP)</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Configure custom MCP tool servers in your local environment.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 space-y-2">
                    <p className="text-[11px] text-zinc-500">
                      MCP servers connect standard tools from PostgreSQL, SQLite, Filesystem, or remote endpoints via <code className="text-zinc-300 font-mono">lib/mcpRegistry.ts</code>.
                    </p>
                    <div className="p-2.5 rounded bg-black border border-zinc-900 font-mono text-[11px] text-zinc-400">
                      {`// Configured in lib/mcpRegistry.ts\nregisterMCPServer({ name: "postgres", ... })`}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "browser" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-zinc-200" />
                      <h3 className="text-xs font-semibold text-zinc-200">Live Web Search</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      DuckDuckGo real-time internet search when explicitly requested.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-zinc-300">Active</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
                      Built-in
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-900 flex justify-end">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
