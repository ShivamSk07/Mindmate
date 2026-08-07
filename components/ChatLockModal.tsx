"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, X, ShieldCheck, KeyRound } from "lucide-react";

interface ChatLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "lock" | "auth" | "remove";
  sessionTitle?: string;
  onSubmitPin: (pin: string) => void;
  errorMessage?: string | null;
}

export function ChatLockModal({
  isOpen,
  onClose,
  mode,
  sessionTitle,
  onSubmitPin,
  errorMessage,
}: ChatLockModalProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPin("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onSubmitPin(nextPin);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-premium max-w-sm w-full rounded-3xl border border-[rgba(255,255,255,0.08)] p-6 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
          {mode === "lock" ? <Lock size={22} /> : mode === "remove" ? <Unlock size={22} /> : <KeyRound size={22} />}
        </div>

        <h3 className="text-sm font-bold text-white mb-1 tracking-tight">
          {mode === "lock" ? "Set 4-Digit Security PIN" : mode === "remove" ? "Remove Chat Lock" : "Locked Chat Authentication"}
        </h3>
        <p className="text-xs text-[#94a3b8] mb-5 max-w-[240px] truncate">
          {sessionTitle ? `"${sessionTitle}"` : "Enter 4-digit security code"}
        </p>

        {/* 4 PIN Indicators */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? "bg-indigo-400 border-indigo-300 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  : "bg-transparent border-[rgba(255,255,255,0.15)]"
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs text-red-400 mb-4 animate-shake font-medium bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
            {errorMessage}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-2xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 border border-[rgba(255,255,255,0.05)] text-white text-base font-semibold transition-all shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClose}
            className="h-12 rounded-2xl text-xs font-semibold text-[#64748b] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-2xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] active:scale-95 border border-[rgba(255,255,255,0.05)] text-white text-base font-semibold transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-2xl text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors flex items-center justify-center"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
