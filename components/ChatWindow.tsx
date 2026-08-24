"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";
import { Sparkles, CornerDownLeft, Copy, Check } from "lucide-react";

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

            const popoverWidth = 270;
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

  const handleInsertToInput = () => {
    const targetText = selectedTextRef.current || selectedText;
    if (targetText) {
      setInjectedInputText(targetText);
      setSelectedText("");
      setSelectionPos(null);
      selectedTextRef.current = "";
      window.getSelection()?.removeAllRanges();
      setTimeout(() => setInjectedInputText(""), 100);
    }
  };

  const handleCreateNewChatWithSelection = () => {
    const targetText = selectedTextRef.current || selectedText;
    if (targetText && onExtractNewChat) {
      onExtractNewChat(targetText);
      setSelectedText("");
      setSelectionPos(null);
      selectedTextRef.current = "";
      window.getSelection()?.removeAllRanges();
    }
  };

  const firstName = username.split(" ")[0] || username;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Floating Selection Extraction Action Bar */}
      {selectedText && selectionPos && (
        <div
          id="selection-action-popover"
          style={{ top: `${selectionPos.top}px`, left: `${selectionPos.left}px` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed z-50 flex items-center gap-1 p-1 bg-[#09090b] text-white border border-[#27272a] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.8)] animate-fade-in"
        >
          {onExtractNewChat && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateNewChatWithSelection();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition-all active:scale-95"
              title="Create New Chat with Selected Paragraph"
            >
              <Sparkles size={13} className="text-white" />
              <span>New Chat</span>
            </button>
          )}

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleInsertToInput();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#18181b] transition-all active:scale-95"
            title="Insert into Input"
          >
            <CornerDownLeft size={13} className="text-emerald-400" />
            <span>Send to Input</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopySelection();
            }}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] transition-all"
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
