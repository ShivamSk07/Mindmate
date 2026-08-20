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
  Loader2,
  Check,
  AlertCircle,
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
        setMessage({ type: "success", text: "Google services disconnected" });
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
    { id: "google", name: "Google Workspace", icon: HardDrive, connected: !!googleIntegration?.connected },
    { id: "mcp", name: "MCP Servers", icon: Plug, connected: false },
    { id: "browser", name: "Web Search", icon: Globe, connected: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-zinc-900 rounded-xl flex flex-col overflow-hidden text-zinc-200">
        
        {/* Header */}
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

        {/* Modal Body */}
        <div className="flex flex-1 min-h-[300px]">
          
          {/* Sidebar */}
          <div className="w-44 border-r border-zinc-900 p-2 space-y-1 bg-[#0a0a0a] flex-shrink-0">
            {INTEGRATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSelectedTab(tab.id); setMessage(null); }}
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

          {/* Main Content */}
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

              {/* GitHub */}
              {selectedTab === "github" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Github size={15} className="text-zinc-200" />
                      <h3 className="text-xs font-semibold text-zinc-200">GitHub</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Allows CoWork to search repositories, commits, code, and issues.
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

              {/* Google Workspace */}
              {selectedTab === "google" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <HardDrive size={15} className="text-zinc-200" />
                      <h3 className="text-xs font-semibold text-zinc-200">Google Workspace</h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Enables access across Google Drive, Gmail, Calendar, and Sheets.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              googleIntegration?.connected ? "bg-emerald-500" : "bg-zinc-700"
                            }`}
                          />
                          <span className="text-xs font-medium text-zinc-300">
                            {googleIntegration?.connected
                              ? googleIntegration.username || "Connected"
                              : "Not Connected"}
                          </span>
                        </div>
                      </div>

                      {googleIntegration?.connected ? (
                        <button
                          onClick={handleDisconnectGoogle}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { window.location.href = "/api/auth/google"; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
                        >
                          <ExternalLink size={13} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Included Services */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      { name: "Google Drive", icon: HardDrive },
                      { name: "Gmail", icon: Mail },
                      { name: "Google Calendar", icon: Calendar },
                      { name: "Google Sheets", icon: FileSpreadsheet },
                    ].map((svc) => {
                      const SvcIcon = svc.icon;
                      return (
                        <div
                          key={svc.name}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-400"
                        >
                          <SvcIcon size={13} className="text-zinc-500" />
                          <span>{svc.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MCP Servers */}
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

              {/* Web Search */}
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

            {/* Footer */}
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
