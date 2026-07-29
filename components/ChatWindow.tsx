"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Sparkles, Compass, Code, PenTool, Search } from "lucide-react";
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

  const quickPrompts = [
    {
      icon: <Sparkles size={16} className="text-indigo-400" />,
      title: "Brainstorm Ideas",
      desc: "Creative concepts & strategies",
      prompt: "Give me 5 creative ideas for a new project",
    },
    {
      icon: <PenTool size={16} className="text-purple-400" />,
      title: "Write & Summarize",
      desc: "Draft essays, emails, or reports",
      prompt: "Help me write a professional, well-structured response",
    },
    {
      icon: <Code size={16} className="text-[#38bdf8]" />,
      title: "Code & Debug",
      desc: "Build features, fix errors",
      prompt: "Write a clean, optimized code snippet with explanations",
    },
    {
      icon: <Search size={16} className="text-emerald-400" />,
      title: "Deep Web Search",
      desc: "Find live info & facts",
      prompt: "What are the latest updates on technology today?",
      forceSearch: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] main-chat overflow-hidden relative">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6 flex justify-center relative z-10 scrollbar-thin">
        <div className="w-full max-w-3xl flex flex-col justify-between">
          <div>
            {/* Redesigned Mobile & Desktop Home / Welcome UI */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[380px] text-center py-6 md:py-12 animate-fade-in relative z-10">
                
                {/* Brand Logo Container */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_30px_rgba(255,255,255,0.04)] relative group bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
                  <img src="/img/logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-cover relative z-10" />
                </div>

                {/* Welcome Heading */}
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                  What can I help with today?
                </h2>
                
                <p className="text-[#94a3b8] text-xs md:text-sm max-w-md leading-relaxed mb-6 px-2">
                  I am <span className="text-white font-semibold">{activePersonaName}</span>. Ask me questions, generate ideas, write code, or start a live voice session.
                  {activeFolder && (
                    <span className="block mt-1 text-[#64748b] text-[11px] font-semibold uppercase tracking-wider">
                      Active Folder: <span className="text-indigo-300">{activeFolder}</span>
                    </span>
                  )}
                </p>

                {/* Quick Suggestion Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left px-2">
                  {quickPrompts.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSend(item.prompt, item.forceSearch)}
                      className="p-3.5 rounded-2xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] cursor-pointer transition-all active:scale-98 group flex items-start gap-3 shadow-sm"
                    >
                      <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] group-hover:scale-105 transition-transform flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#64748b] truncate mt-0.5 font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
