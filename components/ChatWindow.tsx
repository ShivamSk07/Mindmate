import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";
import { Sparkles, CornerDownLeft, Copy, Check } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string, forceSearch?: boolean, mode?: string, tone?: string, length?: string) => void;
  onStop: () => void;
  error?: string | null;
  username: string;
  activePersonaName: string;
  activePersonaAvatar?: string;
  activeFolder: string | null;
  sessionId?: string;
  onExtractNewChat?: (selectedText: string) => void;
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
  const [selectedText, setSelectedText] = useState("");
  const [injectedInputText, setInjectedInputText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [copiedSelection, setCopiedSelection] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2) {
        setSelectedText(text);
        try {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect) {
            setSelectionPos({
              top: Math.max(10, rect.top - 48),
              left: Math.min(window.innerWidth - 220, Math.max(20, rect.left + rect.width / 2 - 100)),
            });
          }
        } catch (e) {}
      } else {
        setSelectedText("");
        setSelectionPos(null);
      }
    };

    document.addEventListener("mouseup", handleSelectionChange);
    return () => document.removeEventListener("mouseup", handleSelectionChange);
  }, []);

  const handleCopySelection = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopiedSelection(true);
      setTimeout(() => setCopiedSelection(false), 1500);
    }
  };

  const handleInsertToInput = () => {
    if (selectedText) {
      setInjectedInputText(selectedText);
      setSelectedText("");
      setSelectionPos(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCreateNewChatWithSelection = () => {
    if (selectedText && onExtractNewChat) {
      onExtractNewChat(selectedText);
      setSelectedText("");
      setSelectionPos(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const firstName = username.split(" ")[0] || username;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Floating Selection Extraction Action Bar */}
      {selectedText && selectionPos && (
        <div
          style={{ top: `${selectionPos.top}px`, left: `${selectionPos.left}px` }}
          className="fixed z-50 flex items-center gap-1 p-1 bg-[rgba(10,10,16,0.94)] backdrop-blur-xl border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] animate-fade-in"
        >
          {onExtractNewChat && (
            <button
              onClick={handleCreateNewChatWithSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all active:scale-95"
              title="Create New Chat with Selected Paragraph"
            >
              <Sparkles size={13} className="text-indigo-400" />
              <span>New Chat</span>
            </button>
          )}

          <button
            onClick={handleInsertToInput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all active:scale-95"
            title="Insert into Input"
          >
            <CornerDownLeft size={13} className="text-emerald-400" />
            <span>Send to Input</span>
          </button>

          <button
            onClick={handleCopySelection}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
            title="Copy Text"
          >
            {copiedSelection ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 flex justify-center relative z-10 scrollbar-thin">
        <div className="w-full max-w-3xl flex flex-col">
          <div className="flex-1">

            {/* ── Welcome Screen (Minimal Gemini Style) ── */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)] md:min-h-[70vh] text-center animate-fade-in px-4 relative">

                {/* Minimal Logo */}
                <div className="mb-6">
                  <img src="/img/logo.png" alt="Clarity" className="w-12 h-12 object-cover opacity-90" />
                </div>

                {/* Greeting text */}
                <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white/90 mb-3">
                  Hello, {firstName}
                </h1>

                <p className="text-base md:text-lg text-zinc-400 font-normal max-w-sm">
                  What can I help you with today?
                </p>

                {activeFolder && (
                  <div className="mt-6 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-400 font-medium">
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

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex flex-col mb-8 w-full animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] text-[#94a3b8] mb-2 uppercase tracking-widest font-bold">
                  <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                    <img src="/img/logo.png" alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  {activePersonaName}
                </div>
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
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
