"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MessageSquare, Menu, Folder, LogOut, ChevronRight, ChevronDown, Search, FolderPlus, Grid, Pin, Lock, Unlock, PanelLeftClose, GitMerge, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SidebarSession {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked?: boolean;
  has_pin?: boolean;
  folder: string;
  active_persona_id: string | null;
  _count: { messages: number };
}

interface SidebarProps {
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  username: string;
  activeFolder: string | null;
  setActiveFolder: (folder: string | null) => void;
  folders: string[];
  setFolders: React.Dispatch<React.SetStateAction<string[]>>;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
  onOpenMergeModal?: () => void;
  onOpenLockModal?: (session: SidebarSession) => void;
}

export function Sidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  username,
  activeFolder,
  setActiveFolder,
  folders,
  setFolders,
  isOpen: propsIsOpen,
  setIsOpen: propsSetIsOpen,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  onOpenMergeModal,
  onOpenLockModal,
}: SidebarProps) {
  const [sessions, setSessions] = useState<SidebarSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ Work: true, Personal: true });
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;
  const setIsOpen = propsSetIsOpen || setInternalIsOpen;

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diffX = startX - e.changedTouches[0].clientX;
      if (diffX > 70 && isOpen && window.innerWidth <= 1024) {
        setIsOpen(false);
      }
    };
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen]);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  }

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData("text/plain", sessionId);
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData("text/plain");
    if (!sessionId) return;

    try {
      const res = await fetch("/api/history/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, folder: folderName }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to update session folder:", err);
    }
  };

  async function togglePinSession(session: SidebarSession, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/history/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, isPinned: !session.is_pinned }),
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error("Failed to toggle pin", e);
    }
  }

  async function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await fetch(`/api/history?sessionId=${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (sessionId === currentSessionId) onNewChat();
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    window.location.href = "/login";
  };

  const createFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed && !folders.includes(trimmed)) {
      setFolders((prev) => [...prev, trimmed]);
      setOpenFolders((prev) => ({ ...prev, [trimmed]: true }));
      setNewFolderName("");
      setShowFolderModal(false);
    } else if (folders.includes(trimmed)) {
      alert("Folder already exists.");
    }
  };

  const toggleFolderCollapse = (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Filter sessions by query
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouped sessions by folder
  const folderMap = folders.reduce((acc, f) => {
    acc[f] = filteredSessions.filter((s) => s.folder === f);
    return acc;
  }, {} as Record<string, SidebarSession[]>);

  // Uncategorized sessions
  const uncategorizedSessions = filteredSessions.filter(
    (s) => !s.folder || !folders.includes(s.folder)
  );

  // Pinned sessions list
  const pinnedSessions = filteredSessions.filter((s) => s.is_pinned);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Panel — Apple macOS Dark Glass Style */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-[280px] bg-[#0b0b0f]/80 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-out lg:h-full shadow-[4px_0_24px_rgba(0,0,0,0.4)] ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Logo + Collapse button */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 tracking-tight text-white">
            <img src="/img/branding.png" alt="Clarity" className="h-6 object-contain brightness-0 invert opacity-90" />
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop collapse button */}
            {onToggleDesktopCollapse && (
              <button
                onClick={onToggleDesktopCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
            {/* Mobile close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action: New Chat & Merge */}
        <div className="p-4 flex gap-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth <= 768) setIsOpen(false);
            }}
            className="flex-1 flex items-center justify-between bg-transparent hover:bg-[#18181b] border border-[#27272a] hover:border-neutral-400 text-neutral-200 hover:text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm transition-all active:scale-98"
          >
            <span>New chat</span>
            <Plus size={14} />
          </button>
          {onOpenMergeModal && (
            <button
              onClick={onOpenMergeModal}
              className="p-2.5 rounded-xl bg-transparent hover:bg-[#18181b] border border-[#27272a] hover:border-indigo-500/40 text-neutral-300 hover:text-indigo-400 transition-all"
              title="Merge Duplicate Chats"
            >
              <GitMerge size={14} />
            </button>
          )}
        </div>

        {/* Scroll Area */}
        <div className="overflow-y-auto px-3 flex-1 space-y-3 scrollbar-thin">

          {/* Pinned Chats Section */}
          {pinnedSessions.length > 0 && (
            <div>
              <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                <Pin size={11} className="rotate-45" />
                <span>Pinned Chats</span>
              </div>
              <div className="space-y-1 mt-1">
                {pinnedSessions.map((session) => (
                  <div
                    key={session.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, session.id)}
                    onClick={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth <= 768) setIsOpen(false);
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all border ${
                      session.id === currentSessionId
                        ? "bg-indigo-500/10 text-white border-indigo-500/30"
                        : "text-[#cbd5e1] hover:bg-[rgba(255,255,255,0.03)] hover:text-white border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {session.is_locked ? (
                        <Lock size={12} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <Pin size={12} className="text-indigo-400 flex-shrink-0 rotate-45" />
                      )}
                      <span className="truncate pr-1">{session.title}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => togglePinSession(session, e)}
                        className="text-[#64748b] hover:text-indigo-400 p-0.5"
                        title="Unpin Chat"
                      >
                        <Pin size={11} className="rotate-45" />
                      </button>
                      {onOpenLockModal && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenLockModal(session); }}
                          className="text-[#64748b] hover:text-amber-400 p-0.5"
                          title={session.is_locked ? "Unlock / Remove PIN" : "Lock Chat with PIN"}
                        >
                          {session.is_locked ? <Unlock size={11} /> : <Lock size={11} />}
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="text-[#64748b] hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Folders List label & actions */}
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
              <span>Folders</span>
              <button
                onClick={() => setShowFolderModal(true)}
                className="hover:text-[var(--text-primary)] transition-colors"
                title="Create Folder"
              >
                <FolderPlus size={13} />
              </button>
            </div>

            {/* All Chats Option */}
            <div
              onClick={() => setActiveFolder(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnFolder(e, "")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all my-1 ${
                activeFolder === null
                  ? "bg-[rgba(255,255,255,0.05)] text-white shadow-sm border border-[rgba(255,255,255,0.03)]"
                  : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.02)] hover:text-white"
              }`}
            >
              <Grid size={13} className="opacity-80" />
              <span>All Chats</span>
            </div>

            {/* Folder groups */}
            {folders.map((f) => {
              const isActive = activeFolder === f;
              const folderChats = folderMap[f] || [];
              const isExpanded = openFolders[f];

              return (
                <div key={f} className="space-y-1 mb-1">
                  <div
                    onClick={() => setActiveFolder(f)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnFolder(e, f)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all border ${
                      isActive
                        ? "bg-[#18181b] text-white border-[#27272a] shadow-sm"
                        : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.02)] hover:text-white border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder size={13} className={isActive ? "text-white" : "text-[#64748b]"} />
                      <span className="truncate max-w-[110px]">{f}</span>
                    </div>
                    <button
                      onClick={(e) => toggleFolderCollapse(f, e)}
                      className="p-0.5 hover:text-white opacity-60 hover:opacity-100 transition-all"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-3 border-l border-[rgba(255,255,255,0.05)] ml-4.5 space-y-1">
                      {folderChats.length === 0 ? (
                        <p className="text-[10px] text-[#64748b] py-1 pl-2.5 opacity-55">Empty folder</p>
                      ) : (
                        folderChats.map((session) => (
                          <div
                            key={session.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, session.id)}
                            onClick={() => {
                              onSelectSession(session.id);
                              if (window.innerWidth <= 768) setIsOpen(false);
                            }}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-all ${
                              session.id === currentSessionId
                                ? "bg-[rgba(255,255,255,0.06)] text-white"
                                : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {session.is_locked && <Lock size={11} className="text-amber-400 flex-shrink-0" />}
                              <span className="truncate pr-1">{session.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => togglePinSession(session, e)}
                                className="text-[#64748b] hover:text-indigo-400"
                                title="Pin Chat"
                              >
                                <Pin size={11} className="rotate-45" />
                              </button>
                              {onOpenLockModal && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onOpenLockModal(session); }}
                                  className="text-[#64748b] hover:text-amber-400"
                                  title={session.is_locked ? "Unlock / Remove PIN" : "Lock Chat with PIN"}
                                >
                                  {session.is_locked ? <Unlock size={11} /> : <Lock size={11} />}
                                </button>
                              )}
                              <button
                                onClick={(e) => deleteSession(session.id, e)}
                                className="text-[#64748b] hover:text-red-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748b]">
              <span>Recent Chats</span>
            </div>

            {/* Search box */}
            <div className="pb-2">
              <div className="flex items-center gap-2 input-premium rounded-xl px-3 py-2 text-xs">
                <Search size={12} className="text-[#64748b] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#f8fafc] w-full placeholder-[#475569]"
                />
              </div>
            </div>

            {/* Uncategorized list */}
            {uncategorizedSessions.length === 0 ? (
              <p className="text-center text-[10px] text-[#64748b] py-4 opacity-50">No recent conversations</p>
            ) : (
              uncategorizedSessions.map((session) => (
                <div
                  key={session.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, session.id)}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth <= 768) setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all border my-1 ${
                    session.id === currentSessionId
                      ? "bg-[rgba(255,255,255,0.06)] text-white border-[rgba(255,255,255,0.04)] shadow-sm"
                      : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.02)] hover:text-white border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {session.is_locked ? (
                      <Lock size={12} className="text-amber-400 flex-shrink-0" />
                    ) : (
                      <MessageSquare size={13} className="text-[#64748b] flex-shrink-0" />
                    )}
                    <span className="truncate pr-1">{session.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => togglePinSession(session, e)}
                      className="text-[#64748b] hover:text-indigo-400 p-0.5"
                      title="Pin Chat"
                    >
                      <Pin size={11} className="rotate-45" />
                    </button>
                    {onOpenLockModal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpenLockModal(session); }}
                        className="text-[#64748b] hover:text-amber-400 p-0.5"
                        title={session.is_locked ? "Unlock / Remove PIN" : "Lock Chat with PIN"}
                      >
                        {session.is_locked ? <Unlock size={11} /> : <Lock size={11} />}
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="text-[#64748b] hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Profile & Signout */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.04)] bg-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate max-w-[110px]">{username}</span>
              <span className="text-[10px] text-[#475569] font-medium tracking-wide uppercase">Clarity Plus</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[10px] text-[#94a3b8] hover:text-red-400 border border-[rgba(255,255,255,0.05)] hover:border-red-500/20 rounded-xl px-3 py-2 bg-transparent hover:bg-red-500/5 transition-all"
              title="Sign out"
            >
              <LogOut size={12} className="flex-shrink-0" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 max-w-[340px] w-full mx-4 shadow-xl animate-fade-in flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Create Folder</h3>
              <p className="text-xs text-neutral-400">Organize your sessions into a new folder category.</p>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-[#27272a] text-white rounded-lg p-2.5 text-xs outline-none focus:border-neutral-500 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              autoFocus
            />
            <div className="flex gap-2.5">
              <button
                onClick={createFolder}
                className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 bg-transparent hover:bg-neutral-900 border border-[#27272a] text-neutral-400 text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
