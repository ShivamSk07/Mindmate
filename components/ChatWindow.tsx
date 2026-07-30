"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/types";

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
  onOpenLiveVoice?: () => void;
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
  onOpenLiveVoice,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const firstName = username.split(" ")[0] || username;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 flex justify-center relative z-10 scrollbar-thin">
        <div className="w-full max-w-3xl flex flex-col">
          <div className="flex-1">

            {/* ── Welcome Screen (Minimal Gemini Style) ── */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)] md:min-h-[70vh] text-center animate-fade-in px-4 relative">

                {/* Minimal Logo */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-white/[0.04] border border-white/[0.08]">
                    <img src="/img/logo.png" alt="Clarity" className="w-8 h-8 object-cover opacity-90" />
                  </div>
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
          onOpenLiveVoice={onOpenLiveVoice}
        />
      </div>
    </div>
  );
}
