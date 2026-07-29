"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Globe, User, Bot, Copy, ThumbsUp, ThumbsDown, Flag, ChevronDown, Volume2, VolumeX } from "lucide-react";
import type { Message } from "@/types";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  message: Message;
  username: string;
  assistantName: string;
  avatarUrl?: string;
}

export function ChatMessage({ message, username, assistantName, avatarUrl }: ChatMessageProps) {
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
    const hasHindi = /[\u0900-\u097F]/.test(plainText);
    utterance.lang = hasHindi ? "hi-IN" : "en-US";

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    setIsPlayingSpeech(true);
    window.speechSynthesis.speak(utterance);
  };

  // Extract thinking process if present (handles closed and unclosed tags for streaming)
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
      cleanContent = ""; // Still thinking, no clean content yet
    }
  }
  // Parser function to split content by [Widget: ...] tags and render them inline
  const renderMessageContent = (text: string) => {
    const widgetRegex = /\[Widget:\s*(\w+)\s+([^\]]+)\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = widgetRegex.exec(text)) !== null) {
      // Add text before widget
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Parse properties
      const type = match[1].toLowerCase();
      const propsStr = match[2];
      const props: Record<string, string> = {};
      const propRegex = /(\w+)="([^"]+)"/g;
      let propMatch;
      while ((propMatch = propRegex.exec(propsStr)) !== null) {
        props[propMatch[1]] = propMatch[2];
      }

      parts.push({
        type: "widget",
        widgetType: type,
        props,
      });

      lastIndex = widgetRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
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
    // In a real application, you would invoke an API here
  };

  // Logo fallback avatar
  const fallbackAvatar = "/img/logo.png";
  const botAvatar = avatarUrl || fallbackAvatar;

  return (
    <div className="flex flex-col mb-6 w-full group animate-fade-in break-words">
      {/* Message Header */}
      <div className="flex items-center gap-2.5 text-xs text-[#94a3b8] mb-2 flex-row">
        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-[rgba(255,255,255,0.03)] border ${
          isUser ? "border-[#27272a]" : "border-[rgba(255,255,255,0.05)]"
        }`}>
          {isUser ? (
            <User size={12} className="text-white" />
          ) : (
            <img src={botAvatar} alt="bot avatar" className="w-full h-full object-cover" />
          )}
        </div>
        <span className={`font-semibold uppercase tracking-widest text-[9px] ${isUser ? "text-neutral-400" : "text-white"}`}>
          {isUser ? username : assistantName}
        </span>
        <span className="opacity-30 text-[9px]">•</span>
        <span className="opacity-50 text-[10px]">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Bubble container */}
      <div className="flex justify-start w-full pl-[34px]">
        <div className="w-full max-w-full flex flex-col gap-2.5 break-words">
          {/* Thinking Process Accordion */}
          {!isUser && thinkingContent && (
            <div className="w-full max-w-2xl bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)] rounded-2xl p-3 shadow-inner">
              <details className="group" open={!cleanContent}>
                <summary className="flex items-center justify-between text-[10px] font-bold text-[#64748b] cursor-pointer list-none select-none uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      {!cleanContent ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#475569]"></span>
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

          {/* Main Bubble */}
          {(isUser || cleanContent) && (
            <div className="text-sm leading-relaxed w-full bg-transparent text-[#f8fafc] px-0 py-0 break-words">
              {isUser ? (
                <p className="whitespace-pre-wrap break-words text-[#cbd5e1]">{cleanContent}</p>
              ) : (
                <div className="space-y-4 w-full">
                  {renderMessageContent(cleanContent).map((part, index) => {
                    if (part.type === "text") {
                      if (!part.content || !part.content.trim()) return null;
                      return (
                        <div key={index} className="prose prose-dark max-w-none text-sm space-y-2">
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
                            {part.content || ""}
                          </ReactMarkdown>
                        </div>
                      );
                    } else if (part.type === "widget") {
                      return (
                        <div key={index} className="w-full">
                          {part.widgetType === "tradingview" && (
                            <div className="w-full h-80 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#131722] my-3 shadow-lg animate-fade-in relative group">
                              <iframe
                                title="TradingView Stock Chart"
                                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${part.props.symbol || "NASDAQ:AAPL"}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC`}
                                className="w-full h-full border-none"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {part.widgetType === "googlemaps" && (
                            <div className="w-full h-80 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#0f0f16] my-3 shadow-lg animate-fade-in relative">
                              <iframe
                                title="Google Maps Location"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(part.props.query || "New Delhi")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                className="w-full h-full border-none filter invert-[0.9] hue-rotate-[180deg] opacity-85 hover:opacity-100 transition-opacity"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {part.widgetType === "youtube" && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-black my-3 shadow-lg animate-fade-in">
                              <iframe
                                title="YouTube Embed Player"
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
              )}
            </div>
          )}

          {/* Sources Section if Web Search Augmentation was Used */}
          {!isUser && message.searched && message.sources && (message.sources as any).length > 0 && (
            <div className="w-full bg-[rgba(56,189,248,0.03)] border border-[rgba(56,189,248,0.12)] rounded-2xl p-4 mt-1.5 max-w-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={13} className="text-sky-400 animate-pulse" />
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                  Sources Found
                </span>
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

          {/* Message Actions */}
          <div className="flex items-center gap-3 mt-1 text-[#64748b] opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors"
              title="Copy message"
            >
              {copied ? (
                <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">Copied!</span>
              ) : (
                <Copy size={13} />
              )}
            </button>

            {!isUser && (
              <button
                onClick={handleSpeech}
                className={`p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors ${isPlayingSpeech ? "text-indigo-400 bg-indigo-500/5 animate-pulse" : ""}`}
                title={isPlayingSpeech ? "Stop speaking" : "Speak message"}
              >
                {isPlayingSpeech ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            )}

            {!isUser && (
              <>
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
                  title="Flag Response"
                >
                  <Flag size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
