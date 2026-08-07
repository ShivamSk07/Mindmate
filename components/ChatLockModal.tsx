"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Unlock, X, KeyRound, ArrowRight, CornerDownLeft } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length === 4) {
      onSubmitPin(pin);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pin.length === 4) {
      handleSubmit();
    }
  };

  // Title displays exact chat title/name requested by user
  const displayTitle = sessionTitle || "Conversation";

  const subtitleText =
    mode === "lock"
      ? "Set 4-digit security PIN to protect this chat"
      : mode === "remove"
      ? "Enter PIN to remove security lock"
      : "Enter 4-digit PIN to view conversation";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#09090b] text-white max-w-sm w-full rounded-2xl border border-[#27272a] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#18181b] transition-all"
        >
          <X size={16} />
        </button>

        {/* Minimal Black & White Badge */}
        <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-white mb-3 shadow-sm">
          {mode === "lock" ? <Lock size={18} /> : mode === "remove" ? <Unlock size={18} /> : <KeyRound size={18} />}
        </div>

        {/* Chat Title as Main Modal Heading */}
        <h3 className="text-base font-semibold text-white tracking-tight mb-1 max-w-[260px] truncate">
          {displayTitle}
        </h3>
        <p className="text-xs text-[#a1a1aa] mb-5">
          {subtitleText}
        </p>

        {/* Hidden Input for Physical Keyboard */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <input
            ref={inputRef}
            type="password"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="sr-only"
            autoFocus
          />

          {/* 4 PIN Indicators */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex gap-3 mb-5 cursor-pointer"
          >
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border flex items-center justify-center text-base font-mono font-bold transition-all ${
                  pin.length > idx
                    ? "bg-white text-black border-white"
                    : "bg-[#18181b] border-[#27272a] text-[#71717a]"
                }`}
              >
                {pin.length > idx ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="text-xs text-red-400 mb-4 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 w-full text-center">
              {errorMessage}
            </p>
          )}

          {/* Explicit Enter / Unlock Button */}
          <button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full py-2.5 mb-5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
          >
            <span>{mode === "auth" ? "Unlock Chat" : mode === "lock" ? "Set PIN Lock" : "Remove PIN"}</span>
            <CornerDownLeft size={13} />
          </button>
        </form>

        {/* Keypad numbers */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-11 rounded-xl bg-[#18181b] hover:bg-[#27272a] active:scale-95 border border-[#27272a] text-white text-sm font-medium transition-all"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClose}
            className="h-11 rounded-xl text-xs font-medium text-[#71717a] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-11 rounded-xl bg-[#18181b] hover:bg-[#27272a] active:scale-95 border border-[#27272a] text-white text-sm font-medium transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-11 rounded-xl text-xs font-medium text-[#a1a1aa] hover:text-white bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] transition-colors flex items-center justify-center"
            title="Delete digit"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
