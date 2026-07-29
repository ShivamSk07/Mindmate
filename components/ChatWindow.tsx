"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Zap } from "lucide-react";
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
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex justify-center relative z-10 scrollbar-thin">
        <div className="w-full max-w-3xl flex flex-col justify-between">
          <div>
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[420px] text-center py-12 animate-fade-in relative z-10">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.03)] relative group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 blur-lg opacity-30 rounded-2xl" />
                  <img src="/img/logo.png" alt="Logo" className="w-10 h-10 object-cover relative z-10" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2 gradient-text">
                  What can I help you with?
                </h2>
                <p className="text-[#a1a1aa] text-sm max-w-sm leading-relaxed">
                  I am {activePersonaName}. Ask me anything — I can search the web for real-time info too.
                  {activeFolder && (
                    <span className="block mt-2 text-[#52525b] text-xs font-semibold uppercase tracking-wider">
                      Folder: <span className="text-white">{activeFolder}</span>
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-2">
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

            {/* Loading animation */}
            {isLoading && (
              <div className="flex flex-col mb-8 w-full animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] text-[#94a3b8] mb-2 uppercase tracking-widest font-bold">
                  <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                    <img src="/img/logo.png" alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  {activePersonaName}
                </div>
                <div className="flex justify-start">
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
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
        <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} sessionId={sessionId} />
      </div>
    </div>
  );
}
