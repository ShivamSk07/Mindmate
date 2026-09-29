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
  Palette,
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
  onOpenCanvaStudio?: () => void;
}

export default function IntegrationsModal({
  isOpen,
  onClose,
  integrations,
  onStatusChange,
  onOpenCanvaStudio,
}: IntegrationsModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>("github");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [canvaManualToken, setCanvaManualToken] = useState("");
  const [isConnectingCanvaToken, setIsConnectingCanvaToken] = useState(false);

  if (!isOpen) return null;

  const githubIntegration = integrations.find((i) => i.id === "github");
  const linkedinIntegration = integrations.find((i) => i.id === "linkedin");
  const vercelIntegration = integrations.find((i) => i.id === "vercel");
  const canvaIntegration = integrations.find((i) => i.id === "canva");

  const handleDisconnectCanva = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cowork/canva/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Canva disconnected" });
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
    { id: "canva", name: "Canva Studio", icon: Palette, connected: !!canvaIntegration?.connected },
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

              {selectedTab === "canva" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center text-white">
                        <Palette size={12} />
                      </div>
                      <h3 className="text-xs font-semibold text-zinc-200">Canva Design Studio</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Connect your Canva account to create presentations, images, posters, and sync account projects.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              canvaIntegration?.connected ? "bg-emerald-500" : "bg-zinc-700"
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-300">
                            {canvaIntegration?.connected
                              ? `@${canvaIntegration.username || "Canva Account"}`
                              : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      {canvaIntegration?.connected ? (
                        <button
                          onClick={handleDisconnectCanva}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                        </button>
                      ) : (
                        <a
                          href="/api/auth/canva"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] hover:opacity-90 text-white text-xs font-medium transition-opacity shadow-sm"
                        >
                          <Palette size={13} />
                          <span>Connect Canva (OAuth)</span>
                        </a>
                      )}
                    </div>

                    {canvaIntegration?.connected ? (
                      onOpenCanvaStudio && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenCanvaStudio();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#00C4CC]/20 to-[#7D2AE8]/20 hover:from-[#00C4CC]/30 hover:to-[#7D2AE8]/30 border border-[#00C4CC]/40 text-xs font-semibold text-white transition-all shadow-sm"
                        >
                          <Palette size={13} className="text-[#00C4CC]" />
                          <span>View Canva Account Projects in Studio</span>
                        </button>
                      )
                    ) : (
                      <div className="pt-2 border-t border-zinc-900/60 space-y-2">
                        <p className="text-[11px] text-zinc-400 font-medium">Or connect via Personal Access Token:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={canvaManualToken}
                            onChange={(e) => setCanvaManualToken(e.target.value)}
                            placeholder="Paste Canva Access Token..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#00C4CC]"
                          />
                          <button
                            onClick={async () => {
                              if (!canvaManualToken.trim()) return;
                              setIsConnectingCanvaToken(true);
                              setMessage(null);
                              try {
                                const res = await fetch("/api/cowork/canva/connect", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ token: canvaManualToken.trim() }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setMessage({ type: "success", text: "Canva account connected successfully" });
                                  setCanvaManualToken("");
                                  onStatusChange();
                                } else {
                                  setMessage({ type: "error", text: data.error || "Failed to connect token" });
                                }
                              } catch (err: any) {
                                setMessage({ type: "error", text: err.message || "Failed to connect token" });
                              } finally {
                                setIsConnectingCanvaToken(false);
                              }
                            }}
                            disabled={isConnectingCanvaToken || !canvaManualToken.trim()}
                            className="px-3 py-1.5 rounded-lg bg-[#00C4CC] text-zinc-950 font-semibold text-xs hover:opacity-90 disabled:opacity-40"
                          >
                            {isConnectingCanvaToken ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-zinc-900/60 text-[11px] text-zinc-500 space-y-1">
                      <p className="text-zinc-400 font-medium">Capabilities:</p>
                      <p>• Automated 16:9 Presentation Pitch Decks & Slide Generation</p>
                      <p>• Instagram Posts, Stories & YouTube Thumbnails</p>
                      <p>• Live Cloud Account Project Sync & Direct Workspace Launching</p>
                    </div>
                  </div>
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
                        <a
                          href="/api/auth/github"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                        >
                          <Github size={13} />
                          <span>Connect GitHub</span>
                        </a>
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
                        <a
                          href="/api/auth/linkedin"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-medium transition-colors shadow-sm"
                        >
                          <Linkedin size={13} />
                          <span>Connect LinkedIn</span>
                        </a>
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
                        <a
                          href="/api/auth/vercel"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                        >
                          <Triangle size={11} className="fill-zinc-950" />
                          <span>Connect Vercel</span>
                        </a>
                      )}
                    </div>
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
