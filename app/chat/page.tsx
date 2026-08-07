"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Sidebar, type SidebarSession } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { useChat } from "@/hooks/useChat";
import { ChevronDown, Sparkles, Sliders, FileSpreadsheet, Archive, Trash2, Heart, CheckSquare, Plus, Edit2, Radio, Menu, MoreVertical, PanelLeftOpen, Lock, GitMerge } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Message } from "@/types";
import { PersonaModal } from "@/components/PersonaModal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ChatLockModal } from "@/components/ChatLockModal";
import { MergeChatsModal } from "@/components/MergeChatsModal";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  // New Features State
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [sessionsList, setSessionsList] = useState<SidebarSession[]>([]);
  const [unlockedSessionIds, setUnlockedSessionIds] = useState<Record<string, string>>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockTargetSession, setLockTargetSession] = useState<SidebarSession | null>(null);
  const [lockModalMode, setLockModalMode] = useState<"lock" | "auth" | "remove">("auth");
  const [lockErrorMessage, setLockErrorMessage] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapse = localStorage.getItem("clarity_desktop_collapsed");
      if (savedCollapse === "true") setIsDesktopCollapsed(true);
    }
  }, []);

  const toggleDesktopCollapse = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("clarity_desktop_collapsed", String(next));
      }
      return next;
    });
  };

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

  // 1. Initial Data Fetching
  const fetchInitialData = useCallback(async () => {
    try {
      const historyRes = await fetch("/api/history");
      if (historyRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const historyData = await historyRes.json();
      if (historyData.username) setUsername(historyData.username);
      if (historyData.sessions) setSessionsList(historyData.sessions);
      if (historyData.profile) {
        setProfile(historyData.profile);
        setMemoryBox(historyData.profile.memoryVault || "");
        applyUserSettings(historyData.profile);
      }

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

  // 2. Select Session with PIN lock check
  const handleSelectSession = useCallback(async (selectedSessionId: string, providedPin?: string) => {
    const targetSession = sessionsList.find((s) => s.id === selectedSessionId);
    const activePin = providedPin || unlockedSessionIds[selectedSessionId];

    if (targetSession?.is_locked && !activePin) {
      setLockTargetSession(targetSession);
      setLockModalMode("auth");
      setLockErrorMessage(null);
      setShowLockModal(true);
      return;
    }

    try {
      const pinQuery = activePin ? `&pinCode=${encodeURIComponent(activePin)}` : "";
      const res = await fetch(`/api/history?sessionId=${selectedSessionId}${pinQuery}`);
      const data = await res.json();

      if (res.status === 403 || !res.ok) {
        const foundTitle = targetSession ? (targetSession as SidebarSession).title : "Protected Conversation";
        setLockTargetSession(targetSession || { id: selectedSessionId, title: foundTitle, is_pinned: false, folder: "", active_persona_id: null, _count: { messages: 0 } });
        setLockModalMode("auth");
        setLockErrorMessage(data.error || "Incorrect PIN code.");
        setShowLockModal(true);
        return;
      }

      clearChat();
      setSessionId(selectedSessionId);
      setShowLockModal(false);
      setLockErrorMessage(null);

      if (activePin) {
        setUnlockedSessionIds((prev) => ({ ...prev, [selectedSessionId]: activePin }));
      }

      const loadedMessages: Message[] = (data.messages || []).map((m: any) => ({
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
    } catch (e) {
      console.error("Failed to load session", e);
    }
  }, [sessionsList, unlockedSessionIds, clearChat, setMessages, setSessionId]);

  // Lock Management Handlers
  const handleOpenLockModal = (session: SidebarSession) => {
    setLockTargetSession(session);
    setLockModalMode(session.is_locked ? "remove" : "lock");
    setLockErrorMessage(null);
    setShowLockModal(true);
  };

  const handleSubmitPin = async (enteredPin: string) => {
    if (!lockTargetSession) return;

    if (lockModalMode === "auth") {
      await handleSelectSession(lockTargetSession.id, enteredPin);
    } else if (lockModalMode === "lock") {
      try {
        const res = await fetch("/api/history/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: lockTargetSession.id,
            isLocked: true,
            pinCode: enteredPin,
          }),
        });

        if (res.ok) {
          setUnlockedSessionIds((prev) => ({ ...prev, [lockTargetSession.id]: enteredPin }));
          setShowLockModal(false);
          fetchInitialData();
        } else {
          setLockErrorMessage("Failed to set security PIN.");
        }
      } catch (e) {
        setLockErrorMessage("Failed to update security PIN.");
      }
    } else if (lockModalMode === "remove") {
      try {
        const res = await fetch("/api/history/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: lockTargetSession.id,
            isLocked: false,
            pinCode: null,
          }),
        });

        if (res.ok) {
          setShowLockModal(false);
          fetchInitialData();
        } else {
          setLockErrorMessage("Failed to remove security PIN.");
        }
      } catch (e) {
        setLockErrorMessage("Failed to remove lock.");
      }
    }
  };

  // Conversation Extraction Handler
  const handleExtractNewChat = async (selectedText: string) => {
    try {
      const res = await fetch("/api/history/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText }),
      });

      const data = await res.json();
      if (res.ok && data.newSessionId) {
        await fetchInitialData();
        await handleSelectSession(data.newSessionId);
      }
    } catch (e) {
      console.error("Failed to extract chat", e);
    }
  };

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

  const botAvatar = activePersona?.avatarUrl || "/img/logo.png";

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden relative p-0 md:p-3 gap-0 md:gap-3">
      
      {/* Sidebar navigation */}
      <div className={`${isDesktopCollapsed ? "hidden lg:hidden" : "block lg:block"}`}>
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
          isDesktopCollapsed={isDesktopCollapsed}
          onToggleDesktopCollapse={toggleDesktopCollapse}
          onOpenMergeModal={() => setShowMergeModal(true)}
          onOpenLockModal={handleOpenLockModal}
        />
      </div>

      {/* Main chat area */}
      <main className="flex-grow flex flex-col min-w-0 h-full relative glass-floating-panel rounded-none md:rounded-[24px] overflow-hidden border-0 md:border border-[rgba(255,255,255,0.06)]">
        
        {/* Chat Toolbar Header — glassmorphism */}
        <header
          className="px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between z-20 relative flex-shrink-0 gap-2"
          style={{
            background: "rgba(8,8,12,0.72)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.03)",
          }}
        >

          {/* Left: Menu + Expand Desktop + Persona Selector */}
          <div className="flex items-center gap-2 relative min-w-0 flex-1">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              title="Toggle Menu"
            >
              <Menu size={17} />
            </button>

            {/* Desktop Expand Sidebar button when collapsed */}
            {isDesktopCollapsed && (
              <button
                onClick={toggleDesktopCollapse}
                className="hidden lg:flex p-2 rounded-xl text-white transition-all active:scale-95 flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={17} />
              </button>
            )}

            {/* Persona selector button */}
            <button
              onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all min-w-0 max-w-[200px]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <img src={botAvatar} alt="bot" className="w-full h-full object-cover" />
              </div>
              <span className="text-[#e4e4e7] tracking-tight font-medium truncate">
                {activePersona?.name || "Clarity"}
              </span>
              <ChevronDown size={11} className="text-[#52525b] flex-shrink-0" />
            </button>

            {/* Persona Dropdown */}
            {showPersonaDropdown && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-56 bg-[rgba(10,10,15,0.92)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-fade-in">
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
          <div className="hidden sm:flex items-center gap-2 text-[#94a3b8]">
            <button
              onClick={() => setShowMergeModal(true)}
              className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-indigo-400 border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center"
              title="Merge Duplicate Chats"
            >
              <GitMerge size={14} />
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
              onClick={() => router.push("/profile")}
              className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center"
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

          {/* Right: Mobile — More */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className="p-2 rounded-xl text-[#a1a1aa] active:scale-95 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              title="More Actions"
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown */}
            {showToolsDropdown && (
              <div
                className="absolute right-3 top-[calc(100%+8px)] w-52 rounded-2xl z-50 p-1.5 animate-fade-in flex flex-col gap-0.5"
                style={{
                  background: "rgba(10,10,16,0.92)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowMergeModal(true); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left w-full"
                >
                  <GitMerge size={14} className="text-indigo-400" />
                  <span>Merge Chats</span>
                </button>
                {sessionId && (
                  <a
                    href={`/api/export/${sessionId}`}
                    download
                    onClick={() => setShowToolsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors"
                  >
                    <FileSpreadsheet size={14} className="text-indigo-400" />
                    <span>Export Chat</span>
                  </a>
                )}
                <button
                  onClick={() => { setShowToolsDropdown(false); router.push("/profile"); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left w-full"
                >
                  <Sliders size={14} className="text-purple-400" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowKanban(true); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left w-full"
                >
                  <CheckSquare size={14} className="text-emerald-400" />
                  <span>Task Board</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); setShowMemoryModal(true); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-white hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left w-full"
                >
                  <Archive size={14} className="text-amber-400" />
                  <span>Memory Vault</span>
                </button>
                <button
                  onClick={() => { setShowToolsDropdown(false); handleClearHistory(); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left w-full border-t border-[rgba(255,255,255,0.04)] mt-0.5"
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
            onExtractNewChat={handleExtractNewChat}
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
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {personas.map((p) => {
                const isActive = activePersona?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePersona(p);
                      setShowQuickSwitcher(false);
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg"
                        : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] text-zinc-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ background: p.colorTheme || "#6366f1" }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-white">{p.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate capitalize">{p.tone}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Memory Vault Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-premium max-w-md w-full rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Archive size={16} className="text-amber-400" />
              Memory Vault
            </h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Explicit instructions or long-term facts Clarity should always remember about you across all chats.
            </p>
            <textarea
              value={memoryBox}
              onChange={(e) => setMemoryBox(e.target.value)}
              placeholder="e.g. I prefer short, concise code answers in TypeScript. My target framework is Next.js App Router."
              rows={5}
              className="w-full bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-amber-400/50 transition-colors resize-none mb-4"
            />
            <div className="flex gap-2">
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

      {/* 4-Digit Security PIN Modal */}
      <ChatLockModal
        isOpen={showLockModal}
        onClose={() => {
          setShowLockModal(false);
          setLockErrorMessage(null);
        }}
        mode={lockModalMode}
        sessionTitle={lockTargetSession?.title}
        onSubmitPin={handleSubmitPin}
        errorMessage={lockErrorMessage}
      />

      {/* Merge Duplicate Chats Modal */}
      <MergeChatsModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        sessions={sessionsList}
        onMergeComplete={async (newId) => {
          await fetchInitialData();
          handleSelectSession(newId);
        }}
      />
    </div>
  );
}
