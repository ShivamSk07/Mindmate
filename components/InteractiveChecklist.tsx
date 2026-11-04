"use client";

import React, { useState } from "react";
import { CheckSquare, Square, Copy, Check, Sparkles } from "lucide-react";

interface InteractiveChecklistProps {
  title?: string;
  items: string[];
}

export default function InteractiveChecklist({ title = "Action Plan & Checklist", items }: InteractiveChecklistProps) {
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleItem = (idx: number) => {
    setCheckedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(checkedState).filter(Boolean).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleCopy = () => {
    const text = items
      .map((item, i) => `${checkedState[i] ? "[x]" : "[ ]"} ${item}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-3 bg-[#0c0c10] border border-white/[0.08] hover:border-violet-500/30 rounded-2xl p-4 shadow-lg transition-all animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Sparkles size={13} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-100">{title}</h4>
            <span className="text-[10px] text-zinc-500">
              {completedCount} of {items.length} tasks completed ({progressPercent}%)
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors border border-white/[0.04]"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? "Copied" : "Copy List"}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isDone = !!checkedState[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleItem(idx)}
              className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                isDone
                  ? "bg-emerald-950/20 text-zinc-500 line-through"
                  : "bg-white/[0.02] hover:bg-white/[0.05] text-zinc-200"
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-zinc-400 hover:text-violet-400 transition-colors flex-shrink-0"
              >
                {isDone ? (
                  <CheckSquare size={15} className="text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <Square size={15} className="text-zinc-600 hover:text-zinc-400" />
                )}
              </button>
              <span className="text-xs leading-relaxed select-none">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
