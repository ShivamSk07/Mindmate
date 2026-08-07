"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Globe, Copy, ThumbsUp, ThumbsDown, Flag, ChevronDown, Volume2, VolumeX, FolderKanban, Sparkles, ArrowRight } from "lucide-react";
import type { Message, Project } from "@/types";
import { useState, useEffect } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface ChatMessageProps {
  message: Message;
  username: string;
  assistantName: string;
  avatarUrl?: string;
  onOpenProject?: (project: Project) => void;
}

export function ChatMessage({ message, username, assistantName, avatarUrl, onOpenProject }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState<number>(message.feedback || 0);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Extract thinking tags
  let thinkingContent = "";
  let cleanContent = message.content;

  if (!isUser && message.content.includes("<thinking>")) {
    const startIndex = message.content.indexOf("<thinking>") + "<thinking>".length;
    const endIndex = message.content.indexOf("</thinking>");
    if (endIndex !== -1) {
      thinkingContent = message.content.substring(startIndex, endIndex).trim();
      cleanContent = message.content.substring(endIndex + "</thinking>".length).trim();
    } else {
      thinkingContent = message.content.substring(startIndex).trim();
      cleanContent = "";
    }
  }

  // Widget parser
  const renderMessageContent = (text: string) => {
    const widgetRegex = /\[Widget:\s*(\w+)\s+([^\]]+)\]/gi;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = widgetRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: text.substring(lastIndex, match.index) });
      }
      const type = match[1].toLowerCase();
      const propsStr = match[2];
      const props: Record<string, string> = {};
      const propRegex = /(\w+)="([^"]+)"/g;
      let propMatch;
      while ((propMatch = propRegex.exec(propsStr)) !== null) {
        props[propMatch[1]] = propMatch[2];
      }
      parts.push({ type: "widget", widgetType: type, props });
      lastIndex = widgetRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.substring(lastIndex) });
    }
    if (parts.length === 0) {
      parts.push({ type: "text", content: text });
    }
    return parts;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: number) => {
    setFeedbackState(type === feedbackState ? 0 : type);
  };

  const handleSpeech = () => {
    if (typeof window === "undefined") return;
    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }
    window.speechSynthesis.cancel();
    const plainText = cleanContent
      .replace(/```[\s\S]*?```/g, "[code block]")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/[*#_\[\]()]/g, "");

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);
    setIsPlayingSpeech(true);
    window.speechSynthesis.speak(utterance);
  };

  const fallbackAvatar = "/img/logo.png";
  const botAvatar = avatarUrl || fallbackAvatar;

  return (
    <div className="flex flex-col mb-5 w-full group animate-fade-in break-words">

      {isUser ? (
        /* ── USER: right-aligned pill bubble (Gemini style) ── */
        <div className="flex justify-end w-full">
          <div className="max-w-[80%] md:max-w-[72%]">
            <div className="bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.07)] rounded-[20px] rounded-tr-[6px] px-4 py-3 text-sm text-[#e4e4e7] leading-relaxed break-words">
              <p className="whitespace-pre-wrap break-words">{cleanContent}</p>
            </div>
            <div className="flex justify-end mt-1 pr-1">
              <span className="text-[10px] text-[#3f3f46]">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── AI: left-aligned with avatar header ── */
        <div className="flex flex-col w-full">

          {/* AI name + timestamp + Confidence Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                <img src={botAvatar} alt={assistantName} className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-[11px] text-white">{assistantName}</span>
              <span className="opacity-30 text-[9px]">•</span>
              <span className="opacity-40 text-[10px]">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Render Feature 2: Confidence Score Meter */}
            <ConfidenceBadge confidence={message.confidenceData} />
          </div>

          {/* Content indented under avatar */}
          <div className="pl-8 flex flex-col gap-2.5 w-full">

            {/* Thinking accordion */}
            {thinkingContent && (
              <div className="w-full max-w-2xl bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] rounded-2xl p-3 shadow-inner">
                <details className="group" open={!cleanContent}>
                  <summary className="flex items-center justify-between text-[10px] font-bold text-[#64748b] cursor-pointer list-none select-none uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        {!cleanContent ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-500" />
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#475569]" />
                        )}
                      </span>
                      Thinking Process
                    </span>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-[#475569] group-hover:text-[#64748b]">
                      <ChevronDown size={11} />
                    </span>
                  </summary>
                  <div className="mt-2.5 text-xs text-[#64748b] leading-relaxed font-mono whitespace-pre-wrap border-t border-[rgba(255,255,255,0.03)] pt-2.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {thinkingContent}
                  </div>
                </details>
              </div>
            )}

            {/* Markdown response */}
            {cleanContent && (
              <div className="text-sm leading-relaxed w-full text-[#f8fafc] break-words">
                <div className="space-y-3 w-full">
                  {renderMessageContent(cleanContent).map((part, index) => {
                    if (part.type === "text") {
                      if (!part.content?.trim()) return null;
                      return (
                        <div key={index} className="prose prose-dark max-w-none text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => <h1 className="text-lg font-bold my-3 text-[#f8fafc]">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold my-2 text-[#f8fafc]">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-medium my-1.5 text-[#f8fafc]">{children}</h3>,
                              p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-[#cbd5e1]">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1 text-[#cbd5e1]">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-[#cbd5e1]">{children}</ol>,
                              code: ({ children, ...props }) => (
                                <code
                                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded px-1.5 py-0.5 text-xs font-mono text-[#a5b4fc]"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-[#050508]/85 border border-[rgba(255,255,255,0.04)] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono shadow-inner">
                                  {children}
                                </pre>
                              ),
                            }}
                          >
                            {part.content}
                          </ReactMarkdown>
                        </div>
                      );
                    }

                    if (part.type === "widget") {
                      return (
                        <div key={index} className="w-full">
                          {part.widgetType === "tradingview" && (
                            <div className="w-full h-80 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#131722] my-3 shadow-lg animate-fade-in">
                              <iframe
                                title="TradingView Stock Chart"
                                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${part.props.symbol || "NASDAQ:AAPL"}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`}
                                className="w-full h-full border-none"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {part.widgetType === "googlemaps" && (
                            <div className="w-full h-80 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] my-3 shadow-lg animate-fade-in">
                              <iframe
                                title="Google Maps"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(part.props.query || "New Delhi")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                className="w-full h-full border-none filter invert-[0.9] hue-rotate-[180deg] opacity-85 hover:opacity-100 transition-opacity"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {part.widgetType === "youtube" && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-black my-3 shadow-lg animate-fade-in">
                              <iframe
                                title="YouTube"
                                src={`https://www.youtube.com/embed/${part.props.videoId || "dQw4w9WgXcQ"}`}
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Render Feature 1: AI Project Manager Interactive Workspace Card */}
            {message.projectData && (
              <div className="w-full max-w-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border border-indigo-500/30 rounded-2xl p-4 mt-2 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <FolderKanban size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">AI Project Workspace</span>
                      <h4 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">{message.projectData.title}</h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {message.projectData.difficulty}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 line-clamp-2 mb-3">
                  {message.projectData.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-400 font-mono">
                      Phases: <strong className="text-white">{message.projectData.phases.length}</strong>
                    </span>
                    <span className="text-indigo-300 font-mono">
                      Progress: <strong>{message.projectData.progressPercentage}%</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenProject && onOpenProject(message.projectData!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition-all active:scale-95 shadow-md"
                  >
                    Open Workspace <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Web search sources */}
            {message.searched && message.sources && (message.sources as any).length > 0 && (
              <div className="w-full bg-[rgba(56,189,248,0.03)] border border-[rgba(56,189,248,0.12)] rounded-2xl p-4 mt-1 max-w-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={13} className="text-sky-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Sources Found</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(message.sources as any).map((source: any, i: number) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[rgba(56,189,248,0.04)] hover:bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.08)] hover:border-[rgba(56,189,248,0.25)] text-sky-400 hover:text-sky-300 rounded-xl px-3 py-1.5 text-xs transition-all max-w-[220px]"
                    >
                      <ExternalLink size={10} className="flex-shrink-0 opacity-70" />
                      <span className="truncate text-[11px] font-medium">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons — visible on hover */}
            <div className="flex items-center gap-3 mt-0.5 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors"
                title="Copy"
              >
                {copied
                  ? <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Copied!</span>
                  : <Copy size={13} />
                }
              </button>
              <button
                onClick={handleSpeech}
                className={`p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors ${isPlayingSpeech ? "text-indigo-400 bg-indigo-500/5 animate-pulse" : ""}`}
                title={isPlayingSpeech ? "Stop" : "Speak"}
              >
                {isPlayingSpeech ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <button
                onClick={() => handleFeedback(1)}
                className={`p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-green-400 transition-colors ${feedbackState === 1 ? "text-green-400 bg-[rgba(34,197,94,0.05)]" : ""}`}
                title="Thumbs Up"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                className={`p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-red-400 transition-colors ${feedbackState === -1 ? "text-red-400 bg-[rgba(239,68,68,0.05)]" : ""}`}
                title="Thumbs Down"
              >
                <ThumbsDown size={13} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-yellow-400 transition-colors"
                title="Flag"
              >
                <Flag size={13} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
