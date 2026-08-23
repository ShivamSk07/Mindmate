"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Globe, Copy, ThumbsUp, ThumbsDown, Flag, ChevronDown, Volume2, VolumeX, Github, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Message } from "@/types";
import { useState, useEffect } from "react";
import MermaidViewer, { isDiagramCode } from "./MermaidViewer";

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
    const hasHindi = /[\u0900-\u097F]/.test(plainText);
    utterance.lang = hasHindi ? "hi-IN" : "en-US";
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
        /* ── USER: right-aligned pill bubble (Refined Dark Glass) ── */
        <div className="flex justify-end w-full">
          <div className="max-w-[80%] md:max-w-[72%]">
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-[20px] rounded-tr-[4px] px-4 py-3 text-sm text-[#f4f4f5] leading-relaxed break-words shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="whitespace-pre-wrap break-words">{cleanContent}</p>
            </div>
            <div className="flex justify-end mt-1 pr-1">
              <span className="text-[10px] text-zinc-500">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── AI: left-aligned with avatar header ── */
        <div className="flex flex-col w-full">

          {/* AI name + timestamp */}
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-2">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.05] border border-white/[0.08] backdrop-blur-md">
              <img src={botAvatar} alt={assistantName} className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-[11px] text-white">{assistantName}</span>
            <span className="opacity-30 text-[9px]">•</span>
            <span className="opacity-40 text-[10px]">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Content indented under avatar */}
          <div className="pl-8 flex flex-col gap-2.5 w-full">

            {/* Thinking accordion */}
            {thinkingContent && (
              <div className="w-full max-w-2xl bg-black/30 backdrop-blur-lg border border-white/[0.06] rounded-xl p-3 shadow-inner">
                <details className="group" open={!cleanContent}>
                  <summary className="flex items-center justify-between text-[10px] font-bold text-[#71717a] cursor-pointer list-none select-none uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      Thinking Process
                    </span>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-[#71717a] group-hover:text-[#a1a1aa]">
                      <ChevronDown size={11} />
                    </span>
                  </summary>
                  <div className="mt-2.5 text-xs text-[#71717a] leading-relaxed font-mono whitespace-pre-wrap border-t border-[#27272a] pt-2.5 max-h-48 overflow-y-auto scrollbar-thin">
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
                              code: ({ children, className, ...props }: any) => {
                                const codeString = String(children || "").trim();
                                const isDiagram = isDiagramCode(className, codeString);

                                if (!props.inline && isDiagram) {
                                  return <MermaidViewer code={codeString} />;
                                }

                                return (
                                  <code
                                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded px-1.5 py-0.5 text-xs font-mono text-[#a5b4fc]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }: any) => {
                                const childCode = String(children?.props?.children || "").trim();
                                const childClass = children?.props?.className || "";
                                if (isDiagramCode(childClass, childCode)) {
                                  return <>{children}</>;
                                }
                                return (
                                  <pre className="bg-[#050508]/85 border border-[rgba(255,255,255,0.04)] rounded-xl p-4 overflow-x-auto text-xs my-3 font-mono shadow-inner">
                                    {children}
                                  </pre>
                                );
                              },
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

            {/* Chat -> CoWork Integration Banner */}
            {(cleanContent.toLowerCase().includes("github") || cleanContent.toLowerCase().includes("repository") || cleanContent.toLowerCase().includes("codebase")) && (
              <div className="mt-3 p-3 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] flex items-center justify-between gap-3 text-xs text-[#8e8e93]">
                <div className="flex items-center gap-2">
                  <Github size={15} className="text-white flex-shrink-0" />
                  <span>I can perform a deeper repository analysis in CoWork.</span>
                </div>
                <Link
                  href="/cowork"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-[#e5e5ea] font-semibold text-xs transition-all flex-shrink-0"
                >
                  <span>Open in CoWork</span>
                  <ArrowRight size={13} />
                </Link>
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
