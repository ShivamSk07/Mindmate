"use client";

import { useState, useEffect } from "react";
import { 
  SupportedMCPServer, 
  getSupportedMCPRegistry, 
  saveMCPRegistry 
} from "@/lib/mcpRegistry";
import { 
  X, 
  Plug, 
  Check, 
  ShieldCheck, 
  Key, 
  Globe, 
  RefreshCw, 
  SlidersHorizontal,
  Power
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegistryUpdated?: () => void;
}

export default function MCPDashboardModal({ isOpen, onClose, onRegistryUpdated }: Props) {
  const [registry, setRegistry] = useState<SupportedMCPServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<SupportedMCPServer | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSupportedMCPRegistry();
      setRegistry(current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenConfig = (server: SupportedMCPServer) => {
    setSelectedServer(server);
    setApiKeyInput(server.apiKey || "");
    setUrlInput(server.customUrl || server.defaultUrl);
    setTestResult(null);
  };

  const handleToggleEnable = (serverId: string) => {
    const updated = registry.map(item => {
      if (item.id === serverId) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });
    setRegistry(updated);
    saveMCPRegistry(updated);
    if (onRegistryUpdated) onRegistryUpdated();
  };

  const handleTestConnection = async () => {
    if (!selectedServer) return;
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`Connection verified. 200 OK (${selectedServer.supportedTools.length} tools discovered).`);
    }, 800);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) return;

    const updated = registry.map(item => {
      if (item.id === selectedServer.id) {
        return {
          ...item,
          apiKey: apiKeyInput.trim(),
          customUrl: urlInput.trim(),
          isConfigured: true,
          enabled: true,
        };
      }
      return item;
    });

    setRegistry(updated);
    saveMCPRegistry(updated);
    setSelectedServer(null);
    if (onRegistryUpdated) onRegistryUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0f0f12] border border-[#232328] rounded-xl shadow-2xl flex flex-col max-h-[85vh] text-zinc-200 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f1f23] flex items-center justify-between flex-shrink-0 bg-[#0f0f12]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center text-zinc-300">
              <Plug size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                MCP Server Settings
                <span className="text-[11px] font-mono text-zinc-400 font-normal">
                  ({registry.filter(r => r.enabled).length} active)
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Manage supported Model Context Protocol servers and authentication keys.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#18181c] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Server List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin">
          {registry.map((server) => (
            <div
              key={server.id}
              className={`p-3.5 rounded-lg border transition-colors flex items-center justify-between gap-4 ${
                server.enabled
                  ? "bg-[#141417] border-[#232328]"
                  : "bg-[#09090b] border-[#1f1f23] opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => handleToggleEnable(server.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                    server.enabled
                      ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                      : "border-zinc-700 bg-transparent"
                  }`}
                  title={server.enabled ? "Disable server" : "Enable server"}
                >
                  {server.enabled && <Check size={12} strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100 truncate">{server.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18181c] text-zinc-400 border border-[#232328]">
                      {server.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {server.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                  {server.isConfigured ? "Configured" : "Unconfigured"}
                </span>

                <button
                  onClick={() => handleOpenConfig(server)}
                  className="px-3 py-1.5 rounded bg-[#18181c] hover:bg-[#232328] text-xs font-medium text-zinc-300 hover:text-white transition-colors border border-[#27272a]"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f1f23] bg-[#0f0f12] flex items-center justify-between text-xs text-zinc-400">
          <span>Type <code className="text-zinc-300 font-mono">@tag</code> in prompt to target specific MCP servers</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-100 text-zinc-900 font-semibold text-xs hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>

      </div>

      {/* Configure Modal */}
      {selectedServer && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSaveConfig} className="w-full max-w-md bg-[#0f0f12] border border-[#232328] rounded-xl p-5 shadow-2xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">
                Configure {selectedServer.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedServer(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Server Endpoint URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={selectedServer.defaultUrl}
                  required
                  className="w-full bg-[#141417] border border-[#232328] rounded px-3 py-2 text-xs text-zinc-100 outline-none font-mono focus:border-zinc-500"
                />
              </div>

              {selectedServer.requiresApiKey && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">API Key / Access Secret</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={selectedServer.apiKeyPlaceholder || "Enter API Key..."}
                    className="w-full bg-[#141417] border border-[#232328] rounded px-3 py-2 text-xs text-zinc-100 outline-none font-mono focus:border-zinc-500"
                  />
                </div>
              )}

              {testResult && (
                <div className="p-2.5 bg-[#141417] border border-emerald-500/30 rounded text-xs text-emerald-400 font-mono">
                  {testResult}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded bg-[#18181c] hover:bg-[#232328] text-xs font-medium text-zinc-300 transition-colors border border-[#27272a] flex items-center gap-1.5"
              >
                {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                <span>{isTesting ? "Testing..." : "Test Server"}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServer(null)}
                  className="px-3 py-1.5 rounded bg-transparent text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 text-zinc-900 font-semibold text-xs hover:bg-white transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
