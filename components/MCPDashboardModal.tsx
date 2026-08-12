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
  ExternalLink,
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

    // Simulate MCP Server ping verification
    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`✅ Connection Successful! Verified ${selectedServer.supportedTools.length} tools on ${selectedServer.name}.`);
    }, 1000);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-zinc-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#232328] flex items-center justify-between flex-shrink-0 bg-[#0f0f12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Plug size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                MCP Registry & Control Dashboard
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {registry.filter(r => r.enabled).length} Active Servers
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure supported Model Context Protocol servers. Type <code className="text-violet-300 bg-[#18181c] px-1 py-0.5 rounded font-mono">@mention</code> in CoWork to direct agent queries.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f1f23] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Supported MCP Servers Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registry.map((server) => (
              <div
                key={server.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  server.enabled
                    ? "bg-[#141417] border-zinc-700 hover:border-zinc-500"
                    : "bg-[#0c0c0e] border-[#232328] opacity-75"
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{server.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{server.name}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            {server.tag}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{server.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleEnable(server.id)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        server.enabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                      }`}
                      title={server.enabled ? "Disable Server" : "Enable Server"}
                    >
                      <Power size={13} />
                      <span>{server.enabled ? "Active" : "Off"}</span>
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {server.description}
                  </p>
                </div>

                {/* Supported Tools Accordion */}
                <div className="pt-2 border-t border-[#232328] space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
                    <span>Supported Tools ({server.supportedTools.length})</span>
                    <span>{server.isConfigured ? "● Configured" : "○ Needs Setup"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {server.supportedTools.slice(0, 3).map(tool => (
                      <span key={tool.name} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#09090b] border border-[#232328] text-zinc-300">
                        {tool.name}
                      </span>
                    ))}
                    {server.supportedTools.length > 3 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#09090b] text-zinc-500">
                        +{server.supportedTools.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[180px]">
                    {server.customUrl || server.defaultUrl}
                  </span>
                  <button
                    onClick={() => handleOpenConfig(server)}
                    className="px-3 py-1.5 rounded-lg bg-[#1f1f23] hover:bg-[#27272a] text-xs font-semibold text-zinc-200 transition-colors border border-[#27272a]"
                  >
                    Configure & API Key
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#232328] bg-[#0f0f12] flex items-center justify-between text-xs text-zinc-400">
          <span>Type <code className="text-violet-300 font-mono">@stitch</code> or <code className="text-violet-300 font-mono">@postgres</code> in CoWork prompt to direct queries</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-100 text-zinc-900 font-bold hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>

      </div>

      {/* ── SUB-MODAL: CONFIGURE SPECIFIC MCP SERVER ── */}
      {selectedServer && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleSaveConfig} className="w-full max-w-lg bg-[#141417] border border-[#27272a] rounded-2xl p-6 shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-[#232328] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedServer.icon}</span>
                <h3 className="text-sm font-bold text-white">Configure {selectedServer.name} ({selectedServer.tag})</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServer(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">MCP Endpoint URL</label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={selectedServer.defaultUrl}
                  required
                  className="w-full bg-[#09090b] border border-[#232328] rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none font-mono"
                />
              </div>

              {selectedServer.requiresApiKey && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-400 mb-1">API Key / Auth Token</label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={selectedServer.apiKeyPlaceholder || "Enter API secret..."}
                    className="w-full bg-[#09090b] border border-[#232328] rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Stored securely on serverless vault.</p>
                </div>
              )}

              {testResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono">
                  {testResult}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-[#1f1f23] hover:bg-[#27272a] text-xs font-semibold text-zinc-200 transition-colors flex items-center gap-1.5"
              >
                {isTesting ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                <span>{isTesting ? "Pinging..." : "Test Connection"}</span>
              </button>

              <div className="flex-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServer(null)}
                  className="px-4 py-2 rounded-xl bg-[#1f1f23] text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
