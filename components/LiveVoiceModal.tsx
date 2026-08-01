"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, PhoneOff, Globe, AlertCircle, RefreshCw, Loader2 } from "lucide-react";

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

type AppState = "start" | "listening" | "thinking" | "speaking" | "error";

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
  const [appState, setAppState] = useState<AppState>("start");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isLiveRef = useRef(false);
  const appStateRef = useRef<AppState>("start");
  const isMutedRef = useRef(false);
  const liveTranscriptRef = useRef("");
  // Whether the user has performed the first gesture unlock
  const unlockedRef = useRef(false);
  // Smooth animation level driven by state
  const animLevelRef = useRef(0);
  const animPhaseRef = useRef(0);

  useEffect(() => { appStateRef.current = appState; }, [appState]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecClass) setIsSupported(false);
    }
  }, []);

  // ─── Canvas — Gemini Live style fluid rings, driven by state ────────────
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
        st === "listening" ? 0.28 + Math.sin(Date.now() / 400) * 0.08
        : st === "speaking" ? 0.45 + Math.sin(Date.now() / 200) * 0.12
        : st === "thinking" ? 0.12
        : 0.06;

      animLevelRef.current += (target - animLevelRef.current) * 0.06;
      animPhaseRef.current += st === "speaking" ? 0.06 : st === "listening" ? 0.045 : 0.025;

      const lvl = animLevelRef.current;
      const phase = animPhaseRef.current;
      const baseR = Math.min(W, H) * 0.26;

      const ringColors: [string, string][] = [
        ["rgba(99,102,241,0.45)", "rgba(168,85,247,0.25)"],
        ["rgba(56,189,248,0.35)", "rgba(99,102,241,0.15)"],
        ["rgba(236,72,153,0.25)", "rgba(129,140,248,0.10)"],
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
        ctx.strokeStyle = r === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)";
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isOpen]);

  // ─── TTS ────────────────────────────────────────────────────────────────
  const cleanForSpeech = (t: string) =>
    t.replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1")
     .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
     .replace(/#+\s+/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
     .replace(/[-*]\s+/g, "").trim();

  // Forward ref so speakText onDone can call startListening
  const startListeningRef = useRef<() => void>(() => {});

  const speakText = useCallback((rawText: string) => {
    const synth = synthRef.current;
    if (!synth) { startListeningRef.current(); return; }
    synth.cancel();

    const sentences = rawText.match(/[^.!?\n]+[.!?\n]*/g) || [rawText];
    let idx = 0;

    const next = () => {
      if (!isLiveRef.current) return;
      if (idx >= sentences.length) {
        // Done speaking → auto-resume listening (no gesture needed, already unlocked)
        if (!isMutedRef.current) {
          setTimeout(() => { startListeningRef.current(); }, 300);
        } else {
          setAppState("start");
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
    if (!text.trim() || !isLiveRef.current) return;

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

      if (!isLiveRef.current) return;
      setAppState("speaking");
      setTranscript("");
      speakText(full);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (isLiveRef.current) startListeningRef.current();
    }
  }, [activePersona, sessionId, activeFolder, speakText, onNewMessageSent]);

  // ─── Core Recognition ────────────────────────────────────────────────────
  // MUST be called from a user-gesture context for first call on Android.
  // After the first call, subsequent calls (from TTS onend) work automatically.
  const startListening = useCallback(() => {
    if (!isLiveRef.current || isMutedRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecClass) {
      setIsSupported(false);
      setErrorMessage("Web Speech API not supported. Use Chrome on Android or Safari on iOS.");
      setAppState("error");
      return;
    }

    setErrorMessage(null);
    setTranscript("");
    liveTranscriptRef.current = "";
    setAppState("listening");

    const rec = new SpeechRecClass();
    rec.continuous = false;     // Single utterance — no beep loop on Android
    rec.interimResults = true;  // Live transcript as user speaks
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
      } else if (isLiveRef.current && !isMutedRef.current && unlockedRef.current) {
        // Auto-restart on transient errors (no-speech, network glitch)
        setTimeout(() => { if (isLiveRef.current && !isMutedRef.current) startListeningRef.current(); }, 400);
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (appStateRef.current !== "listening") return;
      const captured = liveTranscriptRef.current;
      if (captured && captured.length > 1) {
        sendToAI(captured);
      } else if (isLiveRef.current && !isMutedRef.current && unlockedRef.current) {
        // Auto-restart silently — stay in listening mode
        setTimeout(() => {
          if (isLiveRef.current && !isMutedRef.current && appStateRef.current === "listening") {
            startListeningRef.current();
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (_) {
      recognitionRef.current = null;
      setAppState("start");
    }
  }, [selectedLang, sendToAI]);

  // Keep ref current
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      isLiveRef.current = true;
      unlockedRef.current = false;
      setAppState("start");
      setTranscript("");
      setAiResponse("");
      setErrorMessage(null);
      setIsMuted(false);
      liveTranscriptRef.current = "";
    } else {
      isLiveRef.current = false;
      unlockedRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
      setAppState("start");
    }
    return () => {
      isLiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, [isOpen, selectedLang]);

  // ─── Shake to Exit ───────────────────────────────────────────────────────
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

  // ─── Gesture Unlock (called DIRECTLY from tap handler — Android compatible) ──
  const handleGestureUnlock = () => {
    if (!isSupported || errorMessage) return;
    unlockedRef.current = true;
    startListening(); // This IS a user gesture → works on Android
  };

  // ─── Orb Tap ─────────────────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (!isSupported || errorMessage) return;
    if (appState === "start") {
      handleGestureUnlock();
      return;
    }
    if (appState === "thinking") return; // Let AI think
    if (appState === "speaking") {
      // Interrupt AI speech → auto resumes listening
      synthRef.current?.cancel();
      setAppState("listening");
      setAiResponse("");
      setTranscript("");
      setTimeout(() => { startListeningRef.current(); }, 200);
      return;
    }
    // listening → if has transcript, submit it
    if (appState === "listening" && liveTranscriptRef.current.length > 1) {
      try { recognitionRef.current?.stop(); } catch (_) {}
    }
  };

  // Orb visual
  const orbBorder =
    appState === "listening" ? "border-indigo-400/80"
    : appState === "speaking" ? "border-emerald-400/80"
    : appState === "thinking" ? "border-yellow-400/50"
    : "border-white/10";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#090a0f] p-6 text-white select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
            appState === "listening" ? "bg-indigo-400 animate-pulse"
            : appState === "speaking" ? "bg-emerald-400 animate-pulse"
            : appState === "thinking" ? "bg-yellow-400 animate-pulse"
            : "bg-zinc-600"
          }`} />
          <span className="text-sm font-semibold tracking-wide text-zinc-300">
            {activePersona?.name || "Clarity"} Live
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-zinc-300">
            <Globe size={13} className="text-indigo-400" />
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#12131a] text-white">{l.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              isLiveRef.current = false;
              try { recognitionRef.current?.abort(); } catch (_) {}
              synthRef.current?.cancel();
              onClose();
            }}
            className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Orb Area */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10 w-full">

        {/* "Tap to Begin" overlay — shown only before first gesture */}
        {appState === "start" && (
          <div
            onClick={handleGestureUnlock}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-20"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center animate-pulse">
                  <Mic size={32} className="text-indigo-300" />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/15" />
              </div>
              <p className="text-base font-semibold text-zinc-200 tracking-wide mt-2">Tap to begin</p>
              <p className="text-xs text-zinc-500 tracking-wide">After this, it listens automatically</p>
            </div>
          </div>
        )}

        {/* Canvas Orb (always rendered) */}
        <div
          onClick={handleOrbTap}
          className={`relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-150 ${appState === "start" ? "opacity-30" : "opacity-100"}`}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Center orb circle */}
          <div className={`absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-500 ${orbBorder}`}>
            {appState === "start" && (
              <Mic size={28} className="text-zinc-600" />
            )}
            {appState === "listening" && (
              <>
                {activePersona?.avatarUrl
                  ? <img src={activePersona.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-white/20" />
                  : <Mic size={28} className="text-indigo-400 animate-pulse" />
                }
              </>
            )}
            {appState === "thinking" && (
              <Loader2 size={28} className="text-yellow-400 animate-spin" />
            )}
            {appState === "speaking" && (
              <>
                {activePersona?.avatarUrl
                  ? <img src={activePersona.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-emerald-400/30 animate-pulse" />
                  : <Sparkles size={28} className="text-emerald-400 animate-pulse" />
                }
              </>
            )}
            {appState === "error" && <AlertCircle size={28} className="text-red-400" />}

            {/* State label */}
            {appState !== "start" && (
              <span className="text-[9px] font-bold tracking-widest uppercase mt-1.5 text-zinc-500">{appState}</span>
            )}
          </div>
        </div>

        {/* Error */}
        {(!isSupported || errorMessage) && (
          <div className="mt-4 max-w-sm bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <p className="text-xs text-red-300 mb-3">{errorMessage || "Speech API not supported."}</p>
            <button
              onClick={() => { setErrorMessage(null); setAppState("start"); unlockedRef.current = false; }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/20 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 active:scale-95"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Transcript & Response — no instruction text */}
        {isSupported && !errorMessage && appState !== "start" && (
          <div className="mt-6 w-full max-w-lg text-center flex flex-col items-center gap-2 px-4 min-h-[60px]">
            {transcript && (
              <p className="text-sm font-medium text-indigo-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-w-full">
                "{transcript}"
              </p>
            )}
            {aiResponse && (
              <p className="text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-h-28 overflow-y-auto">
                {aiResponse}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls — only mic mute + end */}
      <div className="w-full flex items-center justify-center gap-6 z-10 pb-6">
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
              // Resume listening if live
              if (unlockedRef.current && isLiveRef.current && appStateRef.current === "listening") {
                startListeningRef.current();
              }
            } else {
              setIsMuted(true);
              try { recognitionRef.current?.abort(); } catch (_) {}
              recognitionRef.current = null;
              synthRef.current?.cancel();
              if (appStateRef.current !== "thinking") setAppState("listening");
            }
          }}
          className={`p-4 rounded-full transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-white/[0.08] border border-white/[0.1] text-zinc-300 hover:text-white"
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={() => {
            isLiveRef.current = false;
            try { recognitionRef.current?.abort(); } catch (_) {}
            synthRef.current?.cancel();
            onClose();
          }}
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-red-600/30"
        >
          <PhoneOff size={18} />
          <span>End Live</span>
        </button>
      </div>
    </div>
  );
}
