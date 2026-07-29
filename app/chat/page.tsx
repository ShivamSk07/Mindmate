"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { useChat } from "@/hooks/useChat";
import { ChevronDown, Sparkles, Sliders, FileSpreadsheet, Archive, Trash2, Heart, CheckSquare, Plus, Edit2, Radio, Mic, Menu, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Message } from "@/types";
import { PersonaModal } from "@/components/PersonaModal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LiveVoiceModal } from "@/components/LiveVoiceModal";

interface Persona {
  id: string;
  name: string;
  tone: string;
  colorTheme: string;
  systemPrompt: string;
  isCustom: boolean;
  avatarUrl?: string;
}

export default function ChatPage() {
  const {
    messages,
    isLoading,
    sessionId,
    error,
    sendMessage,
    clearChat,
    stopGeneration,
    setMessages,
    setSessionId,
  } = useChat();

  const [username, setUsername] = useState("User");
  const [profile, setProfile] = useState<any>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>(["Work", "Personal"]);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryBox, setMemoryBox] = useState("");
  const [showKanban, setShowKanban] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [showLiveVoice, setShowLiveVoice] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const router = useRouter();

  // 1. Initial Data Fetching
  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch session histories + user settings
      const historyRes = await fetch("/api/history");
      if (historyRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const historyData = await historyRes.json();
      if (historyData.username) setUsername(historyData.username);
      if (historyData.profile) {
        setProfile(historyData.profile);
        setMemoryBox(historyData.profile.memoryVault || "");
        applyUserSettings(historyData.profile);
      }

      // Fetch personas list
      const personasRes = await fetch("/api/personas");
      const personasData = await personasRes.json();
      const list = personasData.personas || [];
      setPersonas(list);
      if (list.length > 0) {
        const clarityPersona = list.find((p: any) => p.name === "Clarity") || list[0];
        setActivePersona(clarityPersona);
      }
    } catch (e) {
      console.error("Error loading chat metadata", e);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Apply settings to DOM element - always dark
  const applyUserSettings = (profile: any) => {
    if (typeof document !== "undefined") {
      const bubble = profile.bubbleStyle || "modern";
      const size = profile.fontSize || "14";
      document.documentElement.className = "dark";
      document.body.setAttribute("data-theme", "dark");
      document.body.setAttribute("data-bubble-style", bubble);
      document.body.style.setProperty("--font-size-base", `${size}px`);
    }
  };

  // 2. Select Session
  const handleSelectSession = useCallback(async (selectedSessionId: string) => {
    clearChat();
    setSessionId(selectedSessionId);

    try {
      const res = await fetch(`/api/history?sessionId=${selectedSessionId}`);
      const data = await res.json();

      const loadedMessages: Message[] = data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        searched: m.searched,
        sources: m.sources ?? [],
        reaction: m.reaction,
        feedback: m.feedback,
        isFlagged: m.isFlagged,
        confidence: m.confidence,
        createdAt: new Date(m.createdAt),
      }));

      setMessages(loadedMessages);

      // Find if conversation has an active persona
      // We can fetch details or just switch
      const historyRes = await fetch("/api/history");
      const historyData = await historyRes.json();
      const currentConv = historyData.conversations?.find((c: any) => c.id === selectedSessionId);
      if (currentConv && currentConv.active_persona_id) {
        const found = personas.find(p => p.id === currentConv.active_persona_id);
        if (found) setActivePersona(found);
      }

    } catch (e) {
      console.error("Failed to load session", e);
    }
  }, [clearChat, setMessages, setSessionId, personas]);

  // 3. Switch Persona logic
  const handleSelectPersona = async (p: Persona, notifyServer = true) => {
    setActivePersona(p);
    setShowPersonaDropdown(false);
    setShowQuickSwitcher(false);

    if (notifyServer && sessionId) {
      try {
        await fetch("/api/personas/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: sessionId, persona_id: p.id }),
        });
      } catch (e) {
        console.error("Failed to switch persona", e);
      }
    }
  };

  // 4. Send Message Wrapper
  const handleSendMessage = (text: string, forceSearch?: boolean, mode?: string, tone?: string, length?: string) => {
    sendMessage(text, activePersona?.id, activeFolder, forceSearch, mode, tone, length);
  };

  // 5. Memory Management
  const handleSaveMemory = async () => {
    try {
      await fetch("/api/memory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory_vault: memoryBox }),
      });
      setShowMemoryModal(false);
    } catch (e) {
      console.error("Memory save error", e);
    }
  };

  const handleWipeMemory = async () => {
    if (confirm("Wipe all memory context? This will reset your personalization.")) {
      setMemoryBox("");
      try {
        await fetch("/api/memory/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memory_vault: "" }),
        });
        setShowMemoryModal(false);
      } catch (e) {
        console.error("Memory wipe error", e);
      }
    }
  };

  // 6. Clear History
  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your entire chat history? This cannot be undone.")) {
      try {
        await fetch("/api/history?clearAll=true", { method: "DELETE" });
        clearChat();
        fetchInitialData();
      } catch (e) {
        console.error("Failed to clear history", e);
      }
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    if (!confirm("Are you sure you want to delete this custom persona?")) return;

    try {
      const res = await fetch(`/api/personas/delete/${personaId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        fetchInitialData();
        if (activePersona?.id === personaId) {
          const personasRes = await fetch("/api/personas");
          const personasData = await personasRes.json();
          const list = personasData.personas || [];
          setPersonas(list);
          if (list.length > 0) {
            setActivePersona(list[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to delete persona", e);
    }
  };

  // 7. Enhanced Mobile Sensor Shake Feature -> Triggers Live Voice Mode
  useEffect(() => {
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);

      // Shake sensitivity threshold
      if (total > 30) {
        const now = Date.now();
        if (now - lastShake > 1800) {
          lastShake = now;
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([120, 60, 120]);
          }
          setShowLiveVoice(true);
        }
      }
    };

    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handleMotion);
    }
    return () => {
      if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, []);

  // 8. Mobile Swipe Up Gesture -> Triggers Live Voice Mode
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerHeight - e.touches[0].clientY < 60) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startY > window.innerHeight - 60 && startY - e.changedTouches[0].clientY > 90) {
        setShowLiveVoice(true);
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const botAvatar = activePersona?.avatarUrl || "/img/logo.png";

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden relative p-0 md:p-3 gap-0 md:gap-3">
      
      {/* Sidebar navigation */}
      <Sidebar
        currentSessionId={sessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={() => {
          clearChat();
          setIsSidebarOpen(false);
        }}
        username={username}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        folders={folders}
        setFolders={setFolders}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main chat area */}
      <main className="flex-grow flex flex-col min-w-0 h-full relative glass-floating-panel rounded-none md:rounded-[24px] overflow-hidden border-0 md:border border-[rgba(255,255,255,0.08)]">
        
        {/* Chat Toolbar Header */}
        <header className="px-3 md:px-5 py-3 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(10,10,15,0.65)] backdrop-blur-md flex items-center justify-between z-20 relative flex-shrink-0">
          
          {/* Left: Mobile Toggle & Persona Selector */}
          <div className="flex items-center gap-2 relative min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-white transition-all active:scale-95 flex-shrink-0"
              title="Toggle Menu"
            >
              <Menu size={17} />
            </button>

            <button
              onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 border border-[rgba(255,255,255,0.05)] rounded-xl text-xs font-semibold bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] active:scale-95 transition-all shadow-sm max-w-[200px] sm:max-w-none truncate"
            >
              <div className="w-4 h-4 rounded-md overflow-hidden flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.05)]">
                <img src={botAvatar} alt="bot" className="w-full h-full object-cover" />
              </div>
              <span className="text-white tracking-tight font-medium">
                {activePersona?.name || "Select Persona"}
              </span>
              <ChevronDown size={11} className="text-[#64748b]" />
              
              {activeFolder && (
                <div className="flex items-center gap-1 ml-1 px-2 py-0.5 border border-neutral-800 rounded-lg bg-neutral-900 text-[9px] text-neutral-300 font-bold uppercase tracking-wider">
                  <i className="fas fa-folder" />
                  <span>{activeFolder}</span>
                </div>
              )}
            </button>

            {/* Persona Dropdown */}
            {showPersonaDropdown && (
              <div className="absolute left-0 mt-2.5 w-56 bg-[rgba(10,10,15,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-2.5 text-[9px] uppercase font-bold tracking-widest text-[#64748b] border-b border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.1)]">
                  Select Persona
                </div>
                <div className="max-h-56 overflow-y-auto scrollbar-thin">
                  {personas.map((p) => {
                    const avatar = p.avatarUrl || "/img/logo.png";
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPersona(p)}
                        className="group flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.03)] last:border-none cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-grow">
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.06)] flex-shrink-0">
                            <img src={avatar} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white tracking-tight">{p.name}</span>
                            <span className="text-[10px] text-[#64748b] truncate font-medium">{p.tone}</span>
                          </div>
                        </div>
                        {p.isCustom && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPersona(p);
                                setShowPersonaModal(true);
                                setShowPersonaDropdown(false);
                              }}
                              className="p-1 text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors"
                              title="Edit Persona"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePersona(p.id);
                              }}
                              className="p-1 text-[#64748b] hover:text-red-400 hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors"
                              title="Delete Persona"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.15)]">
                  <button
                    onClick={() => {
                      setEditingPersona(null);
                      setShowPersonaModal(true);
                      setShowPersonaDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.04)] text-[9px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white rounded-xl transition-all"
                  >
                    <Plus size={11} />
                    <span>Create Persona</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Tools (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5 text-[#94a3b8]">
            {/* Live Voice Mode Button */}
            <button
              onClick={() => setShowLiveVoice(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer shadow-sm active:scale-95"
              title="Live Voice Mode"
            >
              <Mic size={13} className="text-indigo-400 opacity-90" />
              <span>Live Voice</span>
            </button>

            {sessionId && (
              <a
                href={`/api/export/${sessionId}`}
                download
                className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center"
                title="Export Chat"
              >
                <FileSpreadsheet size={14} />
              </a>
            )}
            <button
              onClick={() => {
                router.push("/profile");
              }}
              className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center cursor-pointer"
              title="Settings"
            >
              <Sliders size={14} />
            </button>
            <button
              onClick={() => setShowKanban(true)}
              className={`p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center ${showKanban ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" : ""}`}
              title="Task Board"
            >
              <CheckSquare size={14} />
            </button>
            <button
              onClick={() => setShowMemoryModal(true)}
              className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center"
              title="Memory Vault"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl hover:bg-red-500/5 hover:text-red-400 border border-transparent hover:border-red-500/10 transition-all flex items-center justify-center"
              title="Clear All History"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Right: Tools (Mobile Overflow Menu) */}
          <div className="flex sm:hidden items-center gap-1.5 text-[#94a3b8] relative">
            <button
              onClick={() => setShowLiveVoice(true)}
              className="p-2 rounded-xl border border-[rgba(255,255,255,0.05)] text-indigo-400 bg-[rgba(255,255,255,0.02)] active:scale-95"
              title="Live Voice Mode"
            >
              <Mic size={15} />
            </button>
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className="p-2 rounded-xl border border-[rgba(255,255,255,0.05)] text-white bg-[rgba(255,255,255,0.02)] active:scale-95"
              title="More Actions"
            >
              <MoreVertical size={16} />
            </button>

            {showToolsDropdown && (
              <div className="absolute right-0 top-11 w-48 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl z-50 p-1.5 animate-fade-in flex flex-col gap-1">
                {sessionId && (
                  <a
                    href={`/api/export/${sessionId}`}
                    download
                    onClick={() => setShowToolsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors"
                  >
                    <FileSpreadsheet size={14} className="text-indigo-400" />
                    <span>Export Chat</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    setShowToolsDropdown(false);
                    router.push("/profile");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                >
                  <Sliders size={14} className="text-purple-400" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowToolsDropdown(false);
                    setShowKanban(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                >
                  <CheckSquare size={14} className="text-emerald-400" />
                  <span>Task Board</span>
                </button>
                <button
                  onClick={() => {
                    setShowToolsDropdown(false);
                    setShowMemoryModal(true);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                >
                  <Archive size={14} className="text-amber-400" />
                  <span>Memory Vault</span>
                </button>
                <button
                  onClick={() => {
                    setShowToolsDropdown(false);
                    handleClearHistory();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left border-t border-[rgba(255,255,255,0.04)] mt-0.5"
                >
                  <Trash2 size={14} />
                  <span>Clear History</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messaging window */}
        <div className="flex-1 min-h-0">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={handleSendMessage}
            onStop={stopGeneration}
            error={error}
            username={username}
            activePersonaName={activePersona?.name || "Clarity"}
            activePersonaAvatar={botAvatar}
            activeFolder={activeFolder}
            sessionId={sessionId}
            onOpenLiveVoice={() => setShowLiveVoice(true)}
          />
        </div>
      </main>

      {/* Floating Swipe-Up/Shake Quick Persona Switcher overlay */}
      {showQuickSwitcher && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-premium rounded-t-3xl border-t border-[rgba(255,255,255,0.06)] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div
              onClick={() => setShowQuickSwitcher(false)}
              className="w-10 h-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] rounded-full mx-auto mb-5 cursor-pointer transition-colors"
            />
            <h3 className="text-sm font-bold text-white text-center mb-5 uppercase tracking-wider text-xs">Switch Persona</h3>
            <div className="grid grid-cols-3 gap-3">
              {personas.map((p) => {
                const avatar = p.avatarUrl || "/img/logo.png";
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className="flex flex-col items-center p-3 rounded-2xl border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer text-center transition-all active:scale-95"
                  >
                    <img src={avatar} className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.06)] mb-2 object-cover" />
                    <span className="text-[10px] font-semibold text-white truncate max-w-full">{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Memory Vault Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-premium rounded-2xl p-6 max-w-[400px] w-full mx-4 shadow-2xl animate-fade-in border border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-bold text-white mb-1.5">Memory Vault</h2>
            <p className="text-xs text-[#94a3b8] mb-4 leading-relaxed">
              Clarity automatically extracts and remembers key facts about you across your sessions. Review or wipe them here.
            </p>
            <textarea
              value={memoryBox}
              onChange={(e) => setMemoryBox(e.target.value)}
              className="w-full h-32 bg-[#050508]/85 border border-[rgba(255,255,255,0.04)] rounded-xl p-3 text-xs text-[#a5b4fc] font-mono outline-none focus:border-indigo-500/40 resize-none mb-4 shadow-inner"
              placeholder="No memories stored yet..."
            />
            <div className="flex gap-2.5">
              <button
                onClick={handleSaveMemory}
                className="flex-1 bg-white text-black font-semibold text-xs py-2.5 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md"
              >
                Update
              </button>
              <button
                onClick={handleWipeMemory}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs py-2.5 rounded-xl active:scale-95 transition-all border border-red-500/20"
              >
                Wipe Memory
              </button>
            </div>
            <button
              onClick={() => setShowMemoryModal(false)}
              className="w-full text-center text-xs text-[#94a3b8] hover:text-white mt-4 font-semibold transition-colors uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom Persona Modal */}
      <PersonaModal
        isOpen={showPersonaModal}
        onClose={() => {
          setShowPersonaModal(false);
          setEditingPersona(null);
        }}
        onSuccess={fetchInitialData}
        editingPersona={editingPersona}
      />

      {/* Kanban Board Drawer */}
      <KanbanBoard
        isOpen={showKanban}
        onClose={() => setShowKanban(false)}
      />

      {/* Real-time Live Voice Modal */}
      <LiveVoiceModal
        isOpen={showLiveVoice}
        onClose={() => setShowLiveVoice(false)}
        activePersona={activePersona}
        sessionId={sessionId}
        activeFolder={activeFolder}
        onNewMessageSent={(userText, assistantReply) => {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", content: userText, createdAt: new Date() },
            { id: crypto.randomUUID(), role: "assistant", content: assistantReply, createdAt: new Date() },
          ]);
        }}
      />
    </div>
  );
}
