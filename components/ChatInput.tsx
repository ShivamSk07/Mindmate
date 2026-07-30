"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Square, Mic, MicOff, Globe, Wand2, Paperclip, Radio } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, forceSearch?: boolean, mode?: string, tone?: string, length?: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  sessionId?: string;
  onOpenLiveVoice?: () => void;
}

export function ChatInput({ onSend, onStop, isLoading, disabled, sessionId, onOpenLiveVoice }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [attachedFile, setAttachedFile] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);

  const slashCommands = [
    { name: "/summarize", desc: "Summarize conversation history" },
    { name: "/rewrite", desc: "Rewrite, refine, and polish text" },
    { name: "/research", desc: "Force deep search on a topic" },
  ];

  const filteredCommands = slashCommands.filter((c) => c.name.startsWith(input));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  };

  const handleSend = (forceSearch = false) => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, forceSearch);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val === "/" || val.startsWith("/")) {
      const spaceIdx = val.indexOf(" ");
      if (spaceIdx === -1) {
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    } else {
      setShowSlashMenu(false);
    }
  };

  const selectCommand = (cmd: string) => {
    if (cmd === "/summarize") {
      onSend("/summarize", false);
      setInput("");
      setShowSlashMenu(false);
    } else {
      setInput(cmd + " ");
      setShowSlashMenu(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectCommand(filteredCommands[slashIndex].name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!sessionId) {
      alert("Start a chat first before uploading files.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setAttachedFile({
        id: data.documentId,
        name: data.filename,
        type: file.type,
      });
    } catch (err: any) {
      alert(err.message || "Failed to parse file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImprove = () => {
    if (!input.trim()) return;
    setInput((prev) => "Draft a clear, structured response for this query: " + prev);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "hi-IN";
        rec.onstart = () => setIsRecording(true);
        rec.onresult = (event: any) => {
          let final = "";
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t + " ";
            else interim += t;
          }
          if (final || interim) {
            setInput((prev) => (prev + " " + final + interim).trim());
          }
        };
        rec.onerror = () => setIsRecording(false);
        rec.onend = () => setIsRecording(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isRecording) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  return (
    <div className="bg-transparent px-3 sm:px-4 pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-5 pt-1.5 relative z-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-2 relative">

        {/* Floating Slash Commands Suggestion Menu */}
        {showSlashMenu && filteredCommands.length > 0 && (
          <div className="absolute bottom-[105%] left-0 max-w-xs w-full bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_-12px_36px_rgba(0,0,0,0.65)] z-50 overflow-hidden animate-fade-in py-1">
            <div className="px-3 py-1 text-[8px] uppercase font-bold tracking-widest text-[#64748b] border-b border-[rgba(255,255,255,0.03)] bg-[rgba(0,0,0,0.1)]">
              Commands
            </div>
            {filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.name}
                onClick={() => selectCommand(cmd.name)}
                onMouseEnter={() => setSlashIndex(idx)}
                className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors ${
                  idx === slashIndex
                    ? "bg-[rgba(99,102,241,0.12)] text-indigo-300 font-semibold"
                    : "text-[#cbd5e1] hover:bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                <span className="text-xs font-mono">{cmd.name}</span>
                <span className="text-[9px] text-[#64748b]">{cmd.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top Options Bar */}
        {input.trim() && (
          <div className="hidden sm:flex justify-end gap-2">
            <button
              onClick={handleImprove}
              className="text-[10px] border border-dashed border-[rgba(255,255,255,0.08)] hover:border-indigo-400 text-[#94a3b8] hover:text-white rounded-full px-3 py-1 transition-all flex items-center gap-1 flex-shrink-0 tracking-wide"
            >
              <Wand2 size={10} />
              Improve
            </button>
          </div>
        )}

        {/* Attachment & Upload Indicator */}
        {(isUploading || attachedFile) && (
          <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-xl p-2 self-start animate-fade-in shadow-inner">
            <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">File:</span>
            {isUploading ? (
              <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                <span className="text-[9px] font-semibold font-mono text-indigo-300">Parsing document...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-[#cbd5e1] font-mono truncate max-w-[200px]">
                  📎 {attachedFile?.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-[#64748b] hover:text-white text-xs font-bold px-1 transition-colors"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Box */}
        <div
          className="flex items-end gap-1.5 sm:gap-2 rounded-[22px] sm:rounded-[24px] px-3 sm:px-4 py-2.5 sm:py-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
        >
          {/* File Attachment */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading || !sessionId}
            className="p-1.5 sm:p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Attach Document (PDF, DOCX, CSV, Image)"
          >
            <Paperclip size={15} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          {/* Mic */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-1.5 sm:p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all flex-shrink-0 ${
              isRecording ? "text-red-400 bg-red-500/5 animate-pulse" : ""
            }`}
            title="Voice Input"
          >
            {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Message Clarity..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm sm:text-sm text-[#f8fafc] placeholder-[#475569] max-h-[180px] min-h-[24px] py-1 leading-relaxed scrollbar-none"
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search on Web button */}
            {!isLoading && (
              <button
                onClick={() => handleSend(true)}
                disabled={!input.trim() || disabled}
                title="Search on Web"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] font-medium text-zinc-400 border border-white/[0.08] bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Globe size={13} className="text-zinc-400" />
                <span className="hidden sm:inline">Search Web</span>
              </button>
            )}

            {isLoading ? (
              <button
                onClick={onStop}
                className="p-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-zinc-300"
                title="Stop generation"
              >
                <Square size={13} />
              </button>
            ) : (
              <button
                onClick={() => handleSend(false)}
                disabled={!input.trim() || disabled}
                className="p-2 rounded-xl bg-white text-black disabled:bg-white/10 disabled:text-zinc-600 disabled:cursor-not-allowed active:scale-95 transition-all"
                title="Send message"
              >
                <Send size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Footer — desktop only */}
        <div className="hidden md:block text-center text-[10px] text-[#3f3f46] tracking-wider font-medium">
          Clarity may make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
}
