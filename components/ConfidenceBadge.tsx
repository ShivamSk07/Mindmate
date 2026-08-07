"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Shield, ChevronDown, Info } from "lucide-react";
import type { ConfidenceData } from "@/types";

interface ConfidenceBadgeProps {
  confidence?: ConfidenceData;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!confidence) return null;

  const { score, level, color, reason, factors } = confidence;

  // Determine badge styling based on level
  const getBadgeStyle = () => {
    switch (color) {
      case "green":
        return {
          bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
          border: "border-emerald-500/20",
          text: "text-emerald-400",
          dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
          icon: <ShieldCheck size={12} className="text-emerald-400" />,
        };
      case "yellow":
        return {
          bg: "bg-amber-500/10 hover:bg-amber-500/20",
          border: "border-amber-500/20",
          text: "text-amber-400",
          dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
          icon: <Shield size={12} className="text-amber-400" />,
        };
      case "orange":
        return {
          bg: "bg-orange-500/10 hover:bg-orange-500/20",
          border: "border-orange-500/20",
          text: "text-orange-400",
          dot: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]",
          icon: <ShieldAlert size={12} className="text-orange-400" />,
        };
      case "red":
      default:
        return {
          bg: "bg-rose-500/10 hover:bg-rose-500/20",
          border: "border-rose-500/20",
          text: "text-rose-400",
          dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
          icon: <ShieldX size={12} className="text-rose-400" />,
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className="relative inline-block mb-2">
      {/* Badge Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${style.bg} ${style.border} ${style.text} transition-all active:scale-95 cursor-pointer shadow-sm`}
        title="Click to view AI confidence analysis"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
        {style.icon}
        <span className="font-semibold">{score}%</span>
        <span className="opacity-80">({level})</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 opacity-70 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable Explanation Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#0d0e15]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] shadow-[0_16px_40px_rgba(0,0,0,0.65)] animate-fade-in text-left text-xs text-zinc-300"
          style={{ zIndex: 60 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Info size={13} className={style.text} />
              <span>Confidence Breakdown</span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}>
              {score}% — {level}
            </span>
          </div>

          {/* Reason Statement */}
          <p className="text-[11px] text-zinc-300 leading-relaxed mb-3 bg-white/[0.03] p-2 rounded-xl border border-white/[0.04]">
            {reason || "Calculated based on verified knowledge, reasoning consistency, and user context clarity."}
          </p>

          {/* Factor Breakdown Bars */}
          {factors && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
                Evaluation Factors
              </div>

              {/* Verified Knowledge */}
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Available Knowledge</span>
                  <span className="font-mono text-zinc-200">{factors.knowledge}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${factors.knowledge}%` }}
                  />
                </div>
              </div>

              {/* Reasoning Consistency */}
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Reasoning Consistency</span>
                  <span className="font-mono text-zinc-200">{factors.consistency}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${factors.consistency}%` }}
                  />
                </div>
              </div>

              {/* Context Clarity */}
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>User Context Clarity</span>
                  <span className="font-mono text-zinc-200">{factors.context}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${factors.context}%` }}
                  />
                </div>
              </div>

              {/* Hallucination Control */}
              <div>
                <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                  <span>Hallucination Safety</span>
                  <span className="font-mono text-zinc-200">{100 - factors.hallucinationRisk}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${100 - factors.hallucinationRisk}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
