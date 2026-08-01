"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, PhoneOff, Globe, AlertCircle, RefreshCw, Pause, Play, Waves, User } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  tone: string;
  colorTheme: string;
  systemPrompt: string;
  isCustom: boolean;
  avatarUrl?: string;
}

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: Persona | null;
  sessionId?: string;
  activeFolder?: string | null;
  onNewMessageSent?: (userText: string, assistantReply: string) => void;
}

type AppState = "listening" | "thinking" | "speaking" | "error";

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "Hinglish / Indian Eng" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "en-US", label: "English (US)" },
];

export function LiveVoiceModal({
  isOpen,
  onClose,
  activePersona,
  sessionId,
  activeFolder,
  onNewMessageSent,
}: LiveVoiceModalProps) {
  const [appState, setAppState] = useState<AppState>("listening");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isLiveRef = useRef(false);
  const appStateRef = useRef<AppState>("listening");
  const isMutedRef = useRef(false);
  const isPausedRef = useRef(false);
  const liveTranscriptRef = useRef("");
  const animLevelRef = useRef(0);
  const animPhaseRef = useRef(0);

  useEffect(() => { appStateRef.current = appState; }, [appState]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecClass) setIsSupported(false);
    }
  }, []);

  // ─── Stitch Immersive Glass Fluid Wave Canvas ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);

      const st = appStateRef.current;
      const target =
        st === "listening" ? 0.35 + Math.sin(Date.now() / 350) * 0.1
        : st === "speaking" ? 0.55 + Math.sin(Date.now() / 180) * 0.15
        : st === "thinking" ? 0.15
        : 0.08;

      animLevelRef.current += (target - animLevelRef.current) * 0.08;
      animPhaseRef.current += st === "speaking" ? 0.07 : st === "listening" ? 0.05 : 0.025;

      const lvl = animLevelRef.current;
      const phase = animPhaseRef.current;
      const baseR = Math.min(W, H) * 0.26;

      const ringColors: [string, string][] = [
        ["rgba(0,210,255,0.50)", "rgba(0,114,255,0.25)"],
        ["rgba(56,189,248,0.40)", "rgba(99,102,241,0.18)"],
        ["rgba(165,231,255,0.30)", "rgba(0,180,255,0.12)"],
      ];

      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          const n =
            Math.sin(a * 4 + phase + r * (Math.PI / 3)) * (8 + lvl * 40) +
            Math.cos(a * 6 - phase * 0.8) * (4 + lvl * 22);
          const rad = baseR + n;
          i === 0
            ? ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
            : ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR * 1.5);
        g.addColorStop(0, ringColors[r][0]);
        g.addColorStop(1, ringColors[r][1]);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = r === 0 ? "rgba(0,210,255,0.4)" : "rgba(255,255,255,0.15)";
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isOpen]);

  // ─── Clean Markdown for TTS ──────────────────────────────────────────────
  const cleanForSpeech = (t: string) =>
    t.replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1")
     .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*\*/g, "$1")
     .replace(/#+\s+/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
     .replace(/[-*]\s+/g, "").trim();

  const startListeningRef = useRef<() => void>(() => {});

  const speakText = useCallback((rawText: string) => {
    const synth = synthRef.current;
    if (!synth) { startListeningRef.current(); return; }
    synth.cancel();

    const sentences = rawText.match(/[^.!?\n]+[.!?\n]*/g) || [rawText];
    let idx = 0;

    const next = () => {
      if (!isLiveRef.current || isPausedRef.current) return;
      if (idx >= sentences.length) {
        if (!isMutedRef.current) {
          setTimeout(() => { startListeningRef.current(); }, 250);
        } else {
          setAppState("listening");
        }
        return;
      }
      const clean = cleanForSpeech(sentences[idx++]);
      if (!clean) { next(); return; }

      const utt = new SpeechSynthesisUtterance(clean);
      utt.rate = 1.2;
      utt.pitch = 1.0;
      const voices = synth.getVoices();
      const lp = selectedLang.split("-")[0];
      utt.voice =
        voices.find(v => v.lang.startsWith(lp) && /Natural|Online|Neural|Google/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith(lp)) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0] || null;
      utt.onend = next;
      utt.onerror = next;
      synth.speak(utt);
    };
    next();
  }, [selectedLang]);

  // ─── Send to AI ──────────────────────────────────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim() || !isLiveRef.current || isPausedRef.current) return;

    setAppState("thinking");
    setAiResponse("");
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_id: sessionId,
          persona_id: activePersona?.id,
          folder: activeFolder || "",
          mode: "fast",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "", buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(part.slice(6));
            if (d.content) { full += d.content; setAiResponse(full); }
          } catch (_) {}
        }
      }

      onNewMessageSent?.(text, full);

      if (!isLiveRef.current || isPausedRef.current) return;
      setAppState("speaking");
      setTranscript("");
      speakText(full);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (isLiveRef.current && !isPausedRef.current) startListeningRef.current();
    }
  }, [activePersona, sessionId, activeFolder, speakText, onNewMessageSent]);

  // ─── Speech Recognition Engine ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isLiveRef.current || isMutedRef.current || isPausedRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecClass) {
      setIsSupported(false);
      setErrorMessage("Web Speech API not supported.");
      setAppState("error");
      return;
    }

    setErrorMessage(null);
    setTranscript("");
    liveTranscriptRef.current = "";
    setAppState("listening");

    const rec = new SpeechRecClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = selectedLang;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interimText += t;
      }
      const combined = (finalText + interimText).trim();
      if (combined) {
        setTranscript(combined);
        liveTranscriptRef.current = combined;
      }
    };

    rec.onerror = (event: any) => {
      recognitionRef.current = null;
      const err = event.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setErrorMessage("Microphone access denied. Allow mic in browser settings.");
        setAppState("error");
        return;
      }
      const captured = liveTranscriptRef.current;
      if (captured && captured.length > 1) {
        sendToAI(captured);
      } else if (isLiveRef.current && !isMutedRef.current && !isPausedRef.current) {
        setTimeout(() => { if (isLiveRef.current && !isMutedRef.current) startListeningRef.current(); }, 350);
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (appStateRef.current !== "listening") return;
      const captured = liveTranscriptRef.current;
      if (captured && captured.length > 1) {
        sendToAI(captured);
      } else if (isLiveRef.current && !isMutedRef.current && !isPausedRef.current) {
        setTimeout(() => {
          if (isLiveRef.current && !isMutedRef.current && appStateRef.current === "listening") {
            startListeningRef.current();
          }
        }, 250);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (_) {
      recognitionRef.current = null;
    }
  }, [selectedLang, sendToAI]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ─── Modal Open / Close ──────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      isLiveRef.current = true;
      setAppState("listening");
      setTranscript("");
      setAiResponse("");
      setErrorMessage(null);
      setIsMuted(false);
      setIsPaused(false);
      liveTranscriptRef.current = "";
      startListening();
    } else {
      isLiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
      setAppState("listening");
    }
    return () => {
      isLiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, [isOpen, selectedLang, startListening]);

  // ─── Shake Sensor to Exit ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let lastShake = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      if (Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0) > 32 && Date.now() - lastShake > 2000) {
        lastShake = Date.now();
        navigator.vibrate?.([100, 50, 100]);
        isLiveRef.current = false;
        try { recognitionRef.current?.abort(); } catch (_) {}
        synthRef.current?.cancel();
        onClose();
      }
    };
    if ("DeviceMotionEvent" in window) window.addEventListener("devicemotion", onMotion);
    return () => { if ("DeviceMotionEvent" in window) window.removeEventListener("devicemotion", onMotion); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ─── Orb Tap ─────────────────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (!isSupported || errorMessage || isPaused) return;
    if (appState === "speaking") {
      synthRef.current?.cancel();
      setAppState("listening");
      setAiResponse("");
      setTranscript("");
      setTimeout(() => { startListeningRef.current(); }, 150);
      return;
    }
    if (appState === "listening") {
      if (liveTranscriptRef.current.length > 1) {
        try { recognitionRef.current?.stop(); } catch (_) {}
      } else {
        startListening();
      }
    }
  };

  const orbBorder =
    appState === "listening" ? "border-[#00d2ff]/80 shadow-[0_0_30px_rgba(0,210,255,0.3)]"
    : appState === "speaking" ? "border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
    : appState === "thinking" ? "border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
    : "border-white/10";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0a0a0a] p-4 md:p-6 text-white select-none overflow-hidden">
      {/* Stitch Top Header Navigation Bar */}
      <header className="w-full flex items-center justify-between z-50 bg-surface/5 backdrop-blur-xl border-b border-white/10 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Waves className="text-[#00d2ff] w-5 h-5 animate-pulse" />
          <h1 className="font-bold text-lg md:text-xl text-[#00d2ff] tracking-tight">
            Clarity Live
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-zinc-300">
            <Globe size={14} className="text-[#00d2ff]" />
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#121414] text-white">{l.label}</option>
              ))}
            </select>
          </div>

          {/* Active Persona / User Avatar Badge */}
          <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20 shadow-md">
            {activePersona?.avatarUrl ? (
              <img src={activePersona.avatarUrl} alt={activePersona.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#00d2ff]/20 flex items-center justify-center text-[#00d2ff]">
                <Sparkles size={16} />
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              isLiveRef.current = false;
              try { recognitionRef.current?.abort(); } catch (_) {}
              synthRef.current?.cancel();
              onClose();
            }}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Close Live Mode"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Stitch Central Voice Aura Visualizer Area */}
      <main className="relative flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        {/* Pulsing Atmosphere Glow */}
        <div className="absolute w-72 h-72 md:w-96 md:h-96 bg-[#00d2ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Central Visualizer Canvas & Orb Node */}
        <div
          onClick={handleOrbTap}
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Inner Glass Sphere Node */}
          <div className={`absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 rounded-full bg-black/60 border-2 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-500 ${orbBorder}`}>
            {activePersona?.avatarUrl ? (
              <img src={activePersona.avatarUrl} alt="" className="w-16 h-16 md:w-18 md:h-18 rounded-full object-cover border border-white/20" />
            ) : (
              <Sparkles size={34} className="text-[#00d2ff]" />
            )}
          </div>
        </div>

        {/* AI Persona Identification Badge */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <span className="text-[#00d2ff] text-xs font-semibold tracking-widest uppercase opacity-90">
            {activePersona?.name || "Clarity AI"}
          </span>
          <span className="text-zinc-400 text-xs font-medium capitalize">
            {isPaused ? "Paused" : appState === "listening" ? "Listening..." : appState === "speaking" ? "Speaking..." : appState === "thinking" ? "Thinking..." : "Error"}
          </span>
        </div>

        {/* Error message */}
        {(!isSupported || errorMessage) && (
          <div className="mt-4 max-w-sm bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
            <p className="text-xs text-red-300 mb-3">{errorMessage || "Speech API not supported."}</p>
            <button
              onClick={() => { setErrorMessage(null); startListening(); }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/20 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 active:scale-95"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Stitch Glass Transcript Card */}
        {isSupported && !errorMessage && (
          <div className="mt-6 w-full max-w-md md:max-w-xl bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/10 space-y-3 shadow-2xl">
            {/* User Transcript Entry */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#00d2ff] text-xs font-semibold">
                <User size={13} />
                <span>You</span>
              </div>
              <p className="text-zinc-200 text-sm italic leading-relaxed">
                {transcript ? `"${transcript}"` : <span className="text-zinc-500 font-normal">Speak anything to start...</span>}
              </p>
            </div>

            {/* Gradient Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent my-2" />

            {/* AI Response Entry */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <Sparkles size={13} />
                <span>{activePersona?.name || "Clarity"}</span>
              </div>
              <p className="text-zinc-200 text-sm leading-relaxed max-h-24 overflow-y-auto scrollbar-thin">
                {aiResponse || <span className="text-zinc-500 italic">Listening for your voice...</span>}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Stitch Bottom Action Control Bar */}
      <footer className="w-full z-50 flex justify-around items-center px-4 py-3 md:py-4 bg-black/40 backdrop-blur-2xl border-t border-white/10 rounded-2xl shadow-2xl">
        {/* Hold / Pause Control */}
        <button
          onClick={() => {
            if (isPaused) {
              setIsPaused(false);
              startListening();
            } else {
              setIsPaused(true);
              try { recognitionRef.current?.abort(); } catch (_) {}
              synthRef.current?.cancel();
            }
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-transform duration-150 active:scale-90 ${
            isPaused
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          {isPaused ? <Play size={24} className="mb-0.5" /> : <Pause size={24} className="mb-0.5" />}
          <span className="text-[11px] font-medium">{isPaused ? "Resume" : "Hold"}</span>
        </button>

        {/* Mute Mic Control (Active Stitch Primary Cyan Container) */}
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
              startListening();
            } else {
              setIsMuted(true);
              try { recognitionRef.current?.abort(); } catch (_) {}
              synthRef.current?.cancel();
            }
          }}
          className={`flex flex-col items-center justify-center rounded-2xl p-3.5 transition-transform duration-150 active:scale-90 ${
            isMuted
              ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              : "bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/30 shadow-[0_0_25px_rgba(0,210,255,0.3)] scale-105"
          }`}
        >
          {isMuted ? <MicOff size={26} className="mb-0.5" /> : <Mic size={26} className="mb-0.5" />}
          <span className="text-[11px] font-bold">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* End Live Control (Red Accent) */}
        <button
          onClick={() => {
            isLiveRef.current = false;
            try { recognitionRef.current?.abort(); } catch (_) {}
            synthRef.current?.cancel();
            onClose();
          }}
          className="flex flex-col items-center justify-center text-red-400 hover:bg-red-500/10 p-3 rounded-2xl active:scale-90 transition-transform duration-150"
        >
          <PhoneOff size={24} className="mb-0.5" />
          <span className="text-[11px] font-medium">End Live</span>
        </button>
      </footer>
    </div>
  );
}
