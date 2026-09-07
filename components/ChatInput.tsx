import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Square, Globe, Wand2, Paperclip, Radio, FileText, Ghost, Terminal, Plus } from "lucide-react";
import { CustomPromptsModal, type CustomPrompt } from "./CustomPromptsModal";

interface ChatInputProps {
  onSend: (
    message: string,
    forceSearch?: boolean,
    mode?: string,
    tone?: string,
    length?: string,
    documentContent?: string,
    documentName?: string,
    documentId?: string,
    isGhost?: boolean
  ) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  sessionId?: string;
  injectedText?: string;
  isGhostMode?: boolean;
  onToggleGhostMode?: () => void;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled,
  sessionId,
  injectedText,
  isGhostMode: externalGhostMode,
  onToggleGhostMode,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isGhost, setIsGhost] = useState(false);

  // Sync ghost mode with external prop if provided
  const activeGhost = externalGhostMode !== undefined ? externalGhostMode : isGhost;

  const toggleGhost = () => {
    if (onToggleGhostMode) {
      onToggleGhostMode();
    } else {
      setIsGhost((prev) => !prev);
    }
  };

  useEffect(() => {
    if (injectedText) {
      setInput((prev) => (prev ? `${prev}\n${injectedText}` : injectedText));
    }
  }, [injectedText]);

  const [attachedFile, setAttachedFile] = useState<{ id?: string; name: string; content?: string; type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [showCustomPromptsModal, setShowCustomPromptsModal] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);

  // Load custom prompts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clarity_custom_prompts");
      if (saved) {
        setCustomPrompts(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const builtInCommands = [
    { name: "/image", desc: "Generate FLUX.1 HD AI image", template: "", isCustom: false },
    { name: "/imagine", desc: "Create photo with FLUX.1 AI", template: "", isCustom: false },
    { name: "/summarize", desc: "Summarize conversation history", template: "/summarize", isCustom: false },
    { name: "/rewrite", desc: "Rewrite, refine, and polish text", template: "/rewrite ", isCustom: false },
    { name: "/research", desc: "Force deep search on a topic", template: "/research ", isCustom: false },
  ];

  const allSlashCommands = [
    ...builtInCommands,
    ...customPrompts.map((cp) => ({
      name: cp.command,
      desc: cp.description || cp.name,
      template: cp.template,
      isCustom: true,
    })),
  ];

  const filteredCommands = allSlashCommands.filter((c) =>
    c.name.toLowerCase().startsWith(input.toLowerCase().trim())
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  };

  const handleSend = (forceSearch = false) => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedFile) || isLoading || isUploading) return;
    
    let messageToSend = trimmed;
    if (attachedFile) {
      if (trimmed) {
        messageToSend = `[Attachment: ${attachedFile.name}]\n\n${trimmed}`;
      } else {
        messageToSend = `[Attachment: ${attachedFile.name}]\n\nPlease analyze and review this attached document.`;
      }
    }

    onSend(
      messageToSend,
      forceSearch,
      undefined,
      undefined,
      undefined,
      attachedFile?.content,
      attachedFile?.name,
      attachedFile?.id,
      activeGhost
    );
    setInput("");
    setAttachedFile(null);
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

  const selectCommand = (cmdItem: { name: string; template?: string; isCustom?: boolean }) => {
    if (cmdItem.name === "/summarize") {
      onSend("/summarize", false, undefined, undefined, undefined, undefined, undefined, undefined, activeGhost);
      setInput("");
      setShowSlashMenu(false);
    } else if (cmdItem.template && cmdItem.template.includes("{text}")) {
      setInput(cmdItem.template.replace("{text}", ""));
      setShowSlashMenu(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else if (cmdItem.template && cmdItem.isCustom) {
      setInput(cmdItem.template + "\n\n");
      setShowSlashMenu(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setInput(cmdItem.name + " ");
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
        selectCommand(filteredCommands[slashIndex]);
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

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (sessionId) {
      formData.append("sessionId", sessionId);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setAttachedFile({
        id: data.documentId || undefined,
        name: data.filename,
        content: data.textContent,
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

  return (
    <div className="bg-transparent px-3 sm:px-4 pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-5 pt-1.5 relative z-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-2 relative">

        {/* Ghost Mode Ambient Banner */}
        {activeGhost && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-300 animate-fade-in shadow-lg shadow-purple-950/20">
            <div className="flex items-center gap-2">
              <Ghost size={14} className="text-purple-400 animate-pulse" />
              <span className="font-medium text-[11px]">Ghost Mode Active — Zero DB Writes • Ephemeral Session</span>
            </div>
            <button
              onClick={toggleGhost}
              className="text-[10px] text-purple-400 hover:text-white underline ml-2 transition-colors"
            >
              Exit Ghost Mode
            </button>
          </div>
        )}

        {/* Floating Slash Commands Suggestion Menu */}
        {showSlashMenu && (
          <div className="absolute bottom-[105%] left-0 max-w-sm w-full bg-[#0d0d12] backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in py-1 max-h-64 flex flex-col">
            <div className="px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest text-zinc-500 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
              <span>Slash Commands & Prompts</span>
              <span className="text-zinc-600 font-normal">Navigate ↑ ↓</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.name}
                  onClick={() => selectCommand(cmd)}
                  onMouseEnter={() => setSlashIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors ${
                    idx === slashIndex
                      ? "bg-indigo-600/15 text-indigo-300 font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-indigo-400">{cmd.name}</span>
                    <span className="text-[11px] text-zinc-400 truncate max-w-[180px]">{cmd.desc}</span>
                  </div>
                  {cmd.isCustom && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Custom
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-1.5 border-t border-zinc-800/80 bg-zinc-950/40">
              <button
                type="button"
                onClick={() => {
                  setShowSlashMenu(false);
                  setShowCustomPromptsModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                <Plus size={12} />
                <span>+ Create / Manage Custom Prompts</span>
              </button>
            </div>
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

        {/* Input Box — Refined Dark Glass Capsule Style */}
        <div
          className={`flex flex-col gap-2 rounded-[24px] px-4 py-2.5 backdrop-blur-2xl border transition-all ${
            activeGhost
              ? "bg-[#130d1c]/80 border-purple-500/30 shadow-[0_8px_32px_rgba(88,28,135,0.25)] focus-within:border-purple-500/60"
              : "bg-[#0e0e14]/75 border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:border-white/[0.18]"
          }`}
        >
          {/* File Attachment Chip Inside Capsule — Minimalist Dark Style */}
          {(isUploading || attachedFile) && (
            <div className="flex items-center gap-2 bg-[#121215] border border-zinc-800 rounded-xl px-3 py-1.5 self-start animate-fade-in shadow-none">
              <FileText size={13} className="text-zinc-400 flex-shrink-0" />
              {isUploading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin flex-shrink-0" />
                  <span className="text-[11px] font-medium text-zinc-300">Reading file...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-zinc-200 truncate max-w-[240px]">
                    {attachedFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-zinc-400 hover:text-white text-xs font-bold px-1 py-0.5 rounded-full hover:bg-zinc-800 transition-colors ml-0.5"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2 w-full">
            {/* File Attachment */}
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={isUploading || disabled}
              className="p-1.5 rounded-full text-[#8e8e93] hover:text-white hover:bg-white/[0.08] transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
              title="Attach Document (PDF, DOCX, CSV, Image)"
            >
              <Paperclip size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const text = e.dataTransfer.getData("text/plain");
                if (text) {
                  setInput((prev) => (prev ? `${prev}\n${text}` : text));
                }
              }}
              placeholder={activeGhost ? "Ask in Ghost Mode (zero trace)..." : "Message Clarity... (Type / for commands)"}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-[#f2f2f7] placeholder-[#8e8e93] max-h-[180px] min-h-[24px] py-1 leading-relaxed scrollbar-none"
            />

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
              {/* Ghost Mode Toggle */}
              <button
                type="button"
                onClick={toggleGhost}
                title={activeGhost ? "Ghost Mode ON (0 DB Writes)" : "Turn on Ghost Mode (Zero Trace)"}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeGhost
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                <Ghost size={13} className={activeGhost ? "text-purple-400" : ""} />
                <span className="hidden md:inline text-[11px]">Ghost</span>
              </button>

              {/* Search on Web button */}
              {!isLoading && (
                <button
                  onClick={() => handleSend(true)}
                  disabled={!input.trim() || disabled}
                  title="Search on Web"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#8e8e93] bg-[#2c2c2e]/60 border border-[#3a3a3c] hover:bg-[#2c2c2e] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Globe size={13} className="text-[#8e8e93]" />
                  <span className="hidden sm:inline">Search Web</span>
                </button>
              )}

              {isLoading ? (
                <button
                  onClick={onStop}
                  className="w-8 h-8 rounded-full bg-[#2c2c2e] border border-[#3a3a3c] text-white flex items-center justify-center transition-all"
                  title="Stop generation"
                >
                  <Square size={12} />
                </button>
              ) : (
                <button
                  onClick={() => handleSend(false)}
                  disabled={!input.trim() || disabled}
                  className="w-8 h-8 rounded-full bg-white text-black hover:bg-[#e5e5ea] disabled:bg-[#2c2c2e] disabled:text-[#6c6c70] disabled:cursor-not-allowed active:scale-95 flex items-center justify-center transition-all flex-shrink-0 shadow-sm"
                  title="Send message"
                >
                  <Send size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-medium">
          <button
            type="button"
            onClick={() => setShowCustomPromptsModal(true)}
            className="hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <Terminal size={11} />
            <span>Prompt Library (/shortcuts)</span>
          </button>
          <span>
            Created by{" "}
            <a
              href="https://www.linkedin.com/in/shivam-kothekar-10296b260/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Shivam Kothekar
            </a>
          </span>
        </div>
      </div>

      {/* Custom Prompts Modal */}
      <CustomPromptsModal
        isOpen={showCustomPromptsModal}
        onClose={() => setShowCustomPromptsModal(false)}
        onPromptsUpdated={(updated) => setCustomPrompts(updated)}
        onSelectPrompt={(tpl) => {
          setInput(tpl.replace("{text}", ""));
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
      />
    </div>
  );
}
