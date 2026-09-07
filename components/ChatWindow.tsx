import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";
import {
  Sparkles,
  CornerDownLeft,
  Copy,
  Check,
  HelpCircle,
  CheckCircle2,
  Languages,
  ArrowRight,
  Search,
  Share2,
  ChevronUp,
  ChevronDown,
  X,
  Code,
  Bot,
  Globe,
  GitFork,
  ExternalLink,
} from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (
    message: string,
    forceSearch?: boolean,
    mode?: string,
    tone?: string,
    length?: string,
    documentContent?: string,
    documentName?: string,
    documentId?: string
  ) => void;
  onStop: () => void;
  error?: string | null;
  username: string;
  activePersonaName: string;
  activePersonaAvatar?: string;
  activeFolder: string | null;
  sessionId?: string;
  onExtractNewChat?: (selectedText: string) => void;
}

/**
 * Context-aware dynamic follow-up suggestion generator that adapts to the assistant's exact response
 */
function getAdaptiveFollowUps(lastAssistantMsg: string, lastUserMsg: string): string[] {
  if (!lastAssistantMsg || lastAssistantMsg.length < 5) return [];

  const isHindi = /\b(kya|hai|ho|kaise|karo|karein|batao|nahi|mera|meri|apna|kaun|kab|kyun|yeh|woh|accha|theek|bhai)\b/i.test(
    lastAssistantMsg + " " + lastUserMsg
  );

  const suggestions: string[] = [];

  // 1. Check if assistant asked closing follow-up questions (e.g. "Would you like me to...", "Do you want...")
  const questionMatches = lastAssistantMsg.match(/([A-Z][^.?!]*\?)/g);
  if (questionMatches && questionMatches.length > 0) {
    for (const q of questionMatches) {
      const cleanQ = q.trim().replace(/^[-*•\d.]+\s*/, "");
      if (
        cleanQ.length > 10 &&
        cleanQ.length < 65 &&
        !cleanQ.toLowerCase().includes("how can i assist") &&
        !cleanQ.toLowerCase().includes("anything else")
      ) {
        suggestions.push(cleanQ);
        if (suggestions.length >= 2) break;
      }
    }
  }

  // 2. Extract key topics / bold concepts from assistant message
  const boldMatches = lastAssistantMsg.match(/\*\*([^*]{3,35})\*\*/g);
  const boldTopics = boldMatches
    ? boldMatches
        .map((m) => m.replace(/\*\*/g, "").trim())
        .filter((t) => t.length > 3 && !t.includes(":") && !t.includes("Note") && !t.includes("Step"))
    : [];

  const topTopic = boldTopics[0] || "";

  // 3. Detect code content
  const hasCode =
    lastAssistantMsg.includes("```") ||
    /\b(function|const|import|class|interface|def |SELECT |return )\b/.test(lastAssistantMsg);

  if (hasCode) {
    if (isHindi) {
      if (topTopic) suggestions.push(`${topTopic} ka working code example dikhao`);
      suggestions.push("Isme error handling aur edge cases kaise handle karein?");
      suggestions.push("Is code ko production ke liye optimize kaise karein?");
    } else {
      if (topTopic) suggestions.push(`Show complete working code for ${topTopic}`);
      suggestions.push("How should we handle errors and edge cases here?");
      suggestions.push("How can we optimize this for production?");
    }
  } else if (/\b(step \d|roadmap|phase|guide|first|second)\b/i.test(lastAssistantMsg)) {
    if (isHindi) {
      if (topTopic) suggestions.push(`${topTopic} ko detail me explain karo`);
      suggestions.push("Is process ka step-by-step implementation guide do");
      suggestions.push("Isme common mistakes kya hoti hain jisse bachna chahiye?");
    } else {
      if (topTopic) suggestions.push(`Deep dive into ${topTopic}`);
      suggestions.push("Show step-by-step implementation for this");
      suggestions.push("What are the most common pitfalls to avoid?");
    }
  } else if (/\b(vs|difference|compare|pros|cons|advantage)\b/i.test(lastAssistantMsg)) {
    if (isHindi) {
      suggestions.push("Dono me se production ke liye sabse best option kaunsa hai?");
      suggestions.push("Inka clear comparison summary table bana do");
      suggestions.push("Real-world project me iska practical example do");
    } else {
      suggestions.push("Which option is best for production use?");
      suggestions.push("Provide a structured comparison summary table");
      suggestions.push("Give a real-world case study or example");
    }
  } else {
    // General conversational / factual responses
    if (isHindi) {
      if (topTopic) suggestions.push(`${topTopic} ke baare me detail me batao`);
      suggestions.push("Iska ek practical real-world example do");
      suggestions.push("Isko implement karne me kya challenges aayenge?");
    } else {
      if (topTopic) suggestions.push(`Can you explain ${topTopic} in more depth?`);
      suggestions.push("Can you give a practical real-world example?");
      suggestions.push("What are the key trade-offs to consider?");
    }
  }

  // De-duplicate and limit to 3 suggestions
  const unique = Array.from(new Set(suggestions)).slice(0, 3);
  return unique;
}

export function ChatWindow({
  messages,
  isLoading,
  onSend,
  onStop,
  error,
  username,
  activePersonaName,
  activePersonaAvatar,
  activeFolder,
  sessionId,
  onExtractNewChat,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedTextRef = useRef("");
  const [selectedText, setSelectedText] = useState("");
  const [injectedInputText, setInjectedInputText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [copiedSelection, setCopiedSelection] = useState(false);

  // In-Chat Search State (Ctrl+F)
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "code" | "ai">("all");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Filter matching messages
  const matchingMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return false;
    const content = m.content.toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (!content.includes(query)) return false;

    if (searchFilter === "code") {
      return content.includes("```") || /\b(function|const|import|class|def|interface)\b/.test(content);
    }
    if (searchFilter === "ai") {
      return m.role === "assistant";
    }
    return true;
  });

  const jumpToMatch = (index: number) => {
    if (matchingMessages.length === 0) return;
    const target = matchingMessages[index];
    if (!target) return;

    setCurrentMatchIndex(index);
    const el = document.getElementById(`chat-msg-${target.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-indigo-500", "bg-indigo-500/10", "rounded-2xl");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-indigo-500", "bg-indigo-500/10");
      }, 2500);
    }
  };

  const handleNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessages.length;
    jumpToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
    jumpToMatch(prevIdx);
  };

  // Keyboard shortcut Ctrl+F / Cmd+F listener
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  const handleShareSession = async () => {
    if (!sessionId) {
      alert("Please send a message to start a conversation before sharing.");
      return;
    }
    try {
      setIsSharing(true);
      const res = await fetch(`/api/share/${sessionId}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create share link");
      }
      const data = await res.json();
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch (e: any) {
      alert(e.message || "Could not generate share link.");
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (matchingMessages.length > 0) {
      jumpToMatch(0);
    } else {
      setCurrentMatchIndex(0);
    }
  }, [searchQuery, searchFilter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const updateSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length >= 2) {
        try {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            selectedTextRef.current = text;
            setSelectedText(text);

            const popoverWidth = 480;
            const popoverHeight = 44;

            let top = rect.top - popoverHeight - 8;
            if (top < 65) {
              top = rect.bottom + 8;
            }
            top = Math.max(10, Math.min(window.innerHeight - 60, top));

            let left = rect.left + rect.width / 2 - popoverWidth / 2;
            left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));

            setSelectionPos({ top, left });
          }
        } catch (e) {}
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const popover = document.getElementById("selection-action-popover");
      if (popover && popover.contains(e.target as Node)) {
        return;
      }
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (!text) {
          setSelectedText("");
          setSelectionPos(null);
          selectedTextRef.current = "";
        } else {
          updateSelection();
        }
      }, 20);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleCopySelection = () => {
    const targetText = selectedTextRef.current || selectedText;
    if (targetText) {
      navigator.clipboard.writeText(targetText);
      setCopiedSelection(true);
      setTimeout(() => setCopiedSelection(false), 1500);
    }
  };

  const handleQuickAsk = (actionType: "explain" | "simplify" | "factcheck" | "translate" | "newchat" | "sendtoinput") => {
    const targetText = selectedTextRef.current || selectedText;
    if (!targetText) return;

    setSelectedText("");
    setSelectionPos(null);
    selectedTextRef.current = "";
    window.getSelection()?.removeAllRanges();

    if (actionType === "explain") {
      onSend(`Explain this specifically:\n\n"${targetText}"`);
    } else if (actionType === "simplify") {
      onSend(`Simplify this and explain in plain, clear terms:\n\n"${targetText}"`);
    } else if (actionType === "factcheck") {
      onSend(`Fact-check and verify if this claim or statement is accurate:\n\n"${targetText}"`, true);
    } else if (actionType === "translate") {
      onSend(`Translate this text into Hindi:\n\n"${targetText}"`);
    } else if (actionType === "newchat" && onExtractNewChat) {
      onExtractNewChat(targetText);
    } else if (actionType === "sendtoinput") {
      setInjectedInputText(targetText);
      setTimeout(() => setInjectedInputText(""), 100);
    }
  };

  const firstName = (username || "User").split(" ")[0] || "User";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Top Floating Control Bar — Search & Share */}
      <div className="absolute top-3 right-4 z-30 flex items-center gap-1.5">
        <button
          onClick={() => {
            setShowSearch((prev) => !prev);
            if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          title="Search in conversation (Ctrl+F)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all backdrop-blur-md shadow-lg ${
            showSearch
              ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/20"
              : "bg-[#0c0c10]/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-white border-zinc-800/90"
          }`}
        >
          <Search size={13} />
          <span className="hidden sm:inline text-[11px]">Find</span>
          <kbd className="hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 font-mono">
            Ctrl+F
          </kbd>
        </button>

        {sessionId && (
          <button
            onClick={handleShareSession}
            disabled={isSharing}
            title="Share conversation link"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0c0c10]/80 hover:bg-zinc-800/90 text-zinc-400 hover:text-white border border-zinc-800/90 text-xs font-medium transition-all backdrop-blur-md shadow-lg"
          >
            <Share2 size={13} className={isSharing ? "animate-spin" : ""} />
            <span className="hidden sm:inline text-[11px]">{isSharing ? "Sharing..." : "Share"}</span>
          </button>
        )}
      </div>

      {/* Floating In-Chat Search Toolbar (Ctrl+F) */}
      {showSearch && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg bg-[#0e0e14]/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl p-2.5 animate-fade-in flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-zinc-400 flex-shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                } else if (e.key === "Escape") {
                  setShowSearch(false);
                  setSearchQuery("");
                }
              }}
              placeholder="Find in this chat..."
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
            />

            {/* Match Counter */}
            {searchQuery.trim() && (
              <span className="text-[11px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800/80">
                {matchingMessages.length > 0
                  ? `${currentMatchIndex + 1} / ${matchingMessages.length}`
                  : "0 matches"}
              </span>
            )}

            {/* Stepper Navigation */}
            <div className="flex items-center gap-0.5 border-l border-zinc-800 pl-1.5">
              <button
                onClick={handlePrevMatch}
                disabled={matchingMessages.length <= 1}
                title="Previous Match (Shift+Enter)"
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={handleNextMatch}
                disabled={matchingMessages.length <= 1}
                title="Next Match (Enter)"
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-1"
                title="Close Search (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/60 text-[10px]">
            <span className="text-zinc-500 px-1">Filter:</span>
            <button
              onClick={() => setSearchFilter("all")}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                searchFilter === "all"
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchFilter("code")}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                searchFilter === "code"
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code size={10} />
              <span>Code Blocks</span>
            </button>
            <button
              onClick={() => setSearchFilter("ai")}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                searchFilter === "ai"
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Bot size={10} />
              <span>AI Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0e0e12] border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Share2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Share Conversation</h3>
                  <p className="text-[11px] text-zinc-400">Anyone with this link can view & fork this chat</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Public Shareable Link</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-zinc-300 outline-none truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedShare(true);
                    setTimeout(() => setCopiedShare(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedShare ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                  <span>{copiedShare ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <GitFork size={13} className="text-indigo-400" />
                <span>Fork & Continue Enabled</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Viewers can fork this exact solution into their workspace to continue building without modifying your original chat.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>Preview Page</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Selection Instant Ask Popover */}
      {selectedText && selectionPos && (
        <div
          id="selection-action-popover"
          style={{ top: `${selectionPos.top}px`, left: `${selectionPos.left}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed z-50 flex items-center gap-1 p-1 bg-[#0c0c0e] text-zinc-200 border border-zinc-800 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] animate-fade-in text-xs select-none max-w-[95vw] overflow-x-auto scrollbar-none"
        >
          <button
            onClick={() => handleQuickAsk("explain")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
            title="Explain selected text"
          >
            <HelpCircle size={13} className="text-zinc-400" />
            <span className="font-medium">Explain</span>
          </button>

          <button
            onClick={() => handleQuickAsk("simplify")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
            title="Simplify in plain terms"
          >
            <Sparkles size={13} className="text-zinc-400" />
            <span className="font-medium">Simplify</span>
          </button>

          <button
            onClick={() => handleQuickAsk("factcheck")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
            title="Fact check this statement"
          >
            <CheckCircle2 size={13} className="text-zinc-400" />
            <span className="font-medium">Fact Check</span>
          </button>

          <button
            onClick={() => handleQuickAsk("translate")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
            title="Translate to Hindi"
          >
            <Languages size={13} className="text-zinc-400" />
            <span className="font-medium">Translate</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-800 mx-0.5 flex-shrink-0" />

          {/* Send to Input */}
          <button
            onClick={() => handleQuickAsk("sendtoinput")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
            title="Insert text into chat input"
          >
            <CornerDownLeft size={13} className="text-zinc-400" />
            <span className="font-medium">Input</span>
          </button>

          {/* New Chat with Selection */}
          {onExtractNewChat && (
            <button
              onClick={() => handleQuickAsk("newchat")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/90 text-zinc-300 hover:text-white transition-all active:scale-95 flex-shrink-0"
              title="Start a new chat with selected text"
            >
              <Sparkles size={13} className="text-zinc-400" />
              <span className="font-medium">New Chat</span>
            </button>
          )}

          <div className="w-[1px] h-4 bg-zinc-800 mx-0.5 flex-shrink-0" />

          <button
            onClick={handleCopySelection}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/90 transition-all flex-shrink-0"
            title="Copy text"
          >
            {copiedSelection ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 flex justify-center relative z-10 scrollbar-thin">
        <div className="w-full max-w-3xl flex flex-col">
          <div className="flex-1">

            {/* Welcome Screen — Refined Dark Glass Design */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-220px)] text-center px-4 relative">
                <div className="w-16 h-16 rounded-[22px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-center p-3 mb-5">
                  <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain opacity-95" />
                </div>

                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f2f2f7] mb-2">
                  Hello, {firstName}
                </h1>

                <p className="text-sm md:text-base text-[#8e8e93] font-normal max-w-sm">
                  What would you like to explore today?
                </p>

                {activeFolder && (
                  <div className="mt-6 px-3.5 py-1 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-xs text-[#8e8e93] font-medium">
                    📁 {activeFolder}
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-2 pb-2">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  username={username}
                  assistantName={activePersonaName}
                  avatarUrl={activePersonaAvatar}
                />
              ))}
            </div>

            {/* Adaptive Follow-Up Suggestions — Dynamically Generated from AI Response */}
            {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (() => {
              const lastMsg = messages[messages.length - 1];
              const suggestions = (lastMsg?.suggestions && lastMsg.suggestions.length > 0)
                ? lastMsg.suggestions
                : getAdaptiveFollowUps(
                    lastMsg?.content || "",
                    messages.length > 1 ? messages[messages.length - 2]?.content || "" : ""
                  );

              if (!suggestions || suggestions.length === 0) return null;

              return (
                <div className="flex flex-col gap-2 mt-4 mb-3 animate-fade-in pl-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    <Sparkles size={11} className="text-zinc-500" />
                    <span>Suggested Next Steps</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSend(suggestion)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e0e11] hover:bg-[#18181c] border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all active:scale-95 shadow-none"
                      >
                        <span className="font-normal">{suggestion}</span>
                        <ArrowRight size={11} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Loading Indicator — ONLY show when response has not started streaming yet */}
            {isLoading && (!messages.length || messages[messages.length - 1]?.role === "user" || !messages[messages.length - 1]?.content) && (
              <div className="flex items-center gap-2 py-2 mb-6 animate-fade-in text-[#8e8e93]">
                <div className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src="/img/logo.png"
                    alt="Clarity"
                    className="w-full h-full object-contain animate-spin [animation-duration:3s]"
                  />
                </div>
                <span className="text-xs font-medium font-sans text-[#a1a1aa] tracking-tight">
                  Clarity is thinking...
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center my-4">
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full inline-block">
                  {error}
                </span>
              </div>
            )}
          </div>
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input Container */}
      <div className="relative z-10">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          isLoading={isLoading}
          sessionId={sessionId}
          injectedText={injectedInputText}
        />
      </div>
    </div>
  );
}
