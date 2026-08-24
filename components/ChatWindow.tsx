"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";
import { Sparkles, CornerDownLeft, Copy, Check, HelpCircle, CheckCircle2, Languages, ArrowRight } from "lucide-react";

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
 * Intelligent contextual next-step suggestion generator tightly coupled to conversation context
 */
function getPredictiveFollowUps(lastAssistantMsg: string, lastUserMsg: string): string[] {
  const combined = (lastAssistantMsg + " " + lastUserMsg).toLowerCase();
  
  // Clean last user query to extract topic keywords
  const cleanTopic = lastUserMsg
    .replace(/^\[Attachment:[^\]]+\]\s*/i, "")
    .replace(/^(can you|please|explain|how to|what is|tell me about|write a|show me|help with)\s+/i, "")
    .trim()
    .slice(0, 45);

  if (combined.includes("```") || combined.includes("function") || combined.includes("const ") || combined.includes("import ") || combined.includes("code") || combined.includes("class ")) {
    return [
      cleanTopic ? `Show step-by-step implementation for ${cleanTopic}` : "Show a complete working code example",
      "What are the common edge cases and pitfalls?",
      "How can we optimize performance here?"
    ];
  }

  if (combined.includes("error") || combined.includes("bug") || combined.includes("exception") || combined.includes("failed") || combined.includes("crash")) {
    return [
      "What other root causes could trigger this?",
      "Show how to write a test case to prevent this",
      "What are the best practices to handle this safely?"
    ];
  }

  if (combined.includes("resume") || combined.includes("cv") || combined.includes("pdf") || combined.includes("document") || combined.includes("mistake") || combined.includes("review")) {
    return [
      "Suggest 3 high-impact phrasing improvements",
      "What are the top 3 strengths and weaknesses?",
      "Format key takeaways into actionable checklist"
    ];
  }

  if (combined.includes("compare") || combined.includes("vs") || combined.includes("difference") || combined.includes("better")) {
    return [
      "Provide a clear comparison summary table",
      "Which option is best for production use?",
      "What are the trade-offs of each approach?"
    ];
  }

  if (combined.includes("step") || combined.includes("guide") || combined.includes("how to") || combined.includes("plan") || combined.includes("roadmap")) {
    return [
      "Break down Step 1 into detailed sub-tasks",
      "What are the biggest risks to watch out for?",
      "Can you provide a time and effort estimate?"
    ];
  }

  if (cleanTopic && cleanTopic.length > 4) {
    return [
      `Can you give a real-world example of ${cleanTopic}?`,
      `Explain key takeaways of ${cleanTopic} in 3 bullet points`,
      `What are the pros and cons of ${cleanTopic}?`
    ];
  }

  return [
    "Can you give a practical real-world example?",
    "Explain this in 3 concise bullet points",
    "What are the pros and cons to consider?"
  ];
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

  const firstName = username.split(" ")[0] || username;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Floating Selection Instant Ask Popover — Minimalist Dark Theme */}
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

            {/* Predictive Follow-Up Suggestions — Minimalist Dark Theme */}
            {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content && (
              <div className="flex flex-col gap-2 mt-4 mb-3 animate-fade-in pl-1">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  <Sparkles size={11} className="text-zinc-500" />
                  <span>Suggested Next Steps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getPredictiveFollowUps(
                    messages[messages.length - 1]?.content || "",
                    messages.length > 1 ? messages[messages.length - 2]?.content || "" : ""
                  ).map((suggestion, idx) => (
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
            )}

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
