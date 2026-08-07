"use client";

import { useState } from "react";
import { GitMerge, X, Check, MessageSquare } from "lucide-react";

interface SidebarSession {
  id: string;
  title: string;
  is_pinned: boolean;
  folder: string;
  _count: { messages: number };
}

interface MergeChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SidebarSession[];
  onMergeComplete: (newSessionId: string) => void;
}

export function MergeChatsModal({
  isOpen,
  onClose,
  sessions,
  onMergeComplete,
}: MergeChatsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergedTitle, setMergedTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedIds.length < 2) {
      setError("Please select at least 2 conversations to merge.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/history/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSessionIds: selectedIds,
          targetTitle: mergedTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to merge conversations.");
      }

      onMergeComplete(data.newSessionId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error merging chats.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-premium max-w-md w-full rounded-3xl border border-[rgba(255,255,255,0.08)] p-6 shadow-2xl flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <GitMerge size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Merge Duplicate Conversations</h3>
            <p className="text-xs text-[#94a3b8]">Combine 2 or more chats chronologically into a single chat.</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 my-2 font-medium bg-red-500/10 p-2 rounded-xl border border-red-500/20">
            {error}
          </p>
        )}

        {/* Title Input */}
        <div className="mt-3 mb-4">
          <label className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block mb-1">
            Merged Chat Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Merged Work Discussions"
            value={mergedTitle}
            onChange={(e) => setMergedTitle(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748b] outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Session Selection List */}
        <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">
          Select Conversations ({selectedIds.length} selected)
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin mb-5">
          {sessions.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-sm"
                    : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] text-zinc-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                      isSelected ? "bg-indigo-500 border-indigo-400 text-white" : "border-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">{s.title}</div>
                    <div className="text-[10px] text-zinc-500">{s._count?.messages || 0} messages</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleMerge}
            disabled={selectedIds.length < 2 || isSubmitting}
            className="flex-1 bg-white text-black font-semibold text-xs py-2.5 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <GitMerge size={14} />
            <span>{isSubmitting ? "Merging..." : "Merge Selected Chats"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-zinc-300 font-semibold text-xs py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
