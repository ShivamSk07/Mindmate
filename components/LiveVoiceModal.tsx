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

type AppState = "ready" | "recording" | "thinking" | "speaking" | "error";

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "Hinglish / Indian Eng" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "en-US", label: "English (US)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Single-shot recognition helper (continuous=false, interimResults=false)
// Most reliable approach on Android Chrome — one tap = one utterance
// ─────────────────────────────────────────────────────────────────────────────
function createRecognition(lang: string) {
  const SpeechRecClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecClass) return null;
  const rec = new SpeechRecClass();
  rec.continuous = false;      // Single utterance — no loop, no beep cycle on Android
  rec.interimResults = true;   // Show live text as user speaks (critical for Android feedback)
  rec.lang = lang;
  rec.maxAlternatives = 1;
  return rec;
}

export function LiveVoiceModal({
  isOpen,
  onClose,
  activePersona,
  sessionId,
  activeFolder,
  onNewMessageSent,
}: LiveVoiceModalProps) {
  const [appState, setAppState] = useState<AppState>("ready");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [noSpeechHint, setNoSpeechHint] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Refs for visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioLevelRef = useRef<number>(0);

  // Stable refs
  const isLiveRef = useRef(false);
  const appStateRef = useRef<AppState>("ready");
  const isMutedRef = useRef(false);
  // Capture live transcript across onresult calls
  const liveTranscriptRef = useRef("");

  useEffect(() => { appStateRef.current = appState; }, [appState]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecClass) setIsSupported(false);
    }
  }, []);

  // ─── Canvas Visualizer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let phase = 0;
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const lvl = audioLevelRef.current;
      phase += 0.04 + lvl * 0.08;
      const baseR = Math.min(W, H) * 0.26;
      const colors = [
        ["rgba(99,102,241,0.45)", "rgba(168,85,247,0.25)"],
        ["rgba(56,189,248,0.35)", "rgba(99,102,241,0.15)"],
        ["rgba(236,72,153,0.25)", "rgba(129,140,248,0.10)"],
      ];
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          const n = Math.sin(a * 4 + phase + r * (Math.PI / 3)) * (8 + lvl * 35)
                  + Math.cos(a * 6 - phase * 0.8) * (4 + lvl * 20);
          const rad = baseR + n;
          i === 0
            ? ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
            : ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR * 1.5);
        g.addColorStop(0, colors[r][0]);
        g.addColorStop(1, colors[r][1]);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = r === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)";
        ctx.stroke();
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isOpen]);

  // ─── Mic Visualizer Stream ───────────────────────────────────────────────
  const startAnalyzer = useCallback(async () => {
    try {
      if (mediaStreamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const actx = new AudioCtx();
      if (actx.state === "suspended") await actx.resume();
      audioCtxRef.current = actx;
      const src = actx.createMediaStreamSource(stream);
      const an = actx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.8;
      src.connect(an);
      analyserRef.current = an;
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let s = 0;
        for (const v of data) s += v;
        audioLevelRef.current = Math.min(1, (s / data.length) / 80);
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setErrorMessage("Microphone access denied. Please allow mic in browser settings.");
        setAppState("error");
      }
    }
  }, []);

  const stopAnalyzer = useCallback(() => {
    analyserRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (audioCtxRef.current?.state !== "closed") audioCtxRef.current?.close();
    audioCtxRef.current = null;
    audioLevelRef.current = 0;
  }, []);

  // ─── TTS ────────────────────────────────────────────────────────────────
  const cleanForSpeech = (t: string) =>
    t.replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1")
     .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
     .replace(/#+\s+/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
     .replace(/[-*]\s+/g, "").trim();

  const speakText = useCallback((rawText: string, onDone: () => void) => {
    const synth = synthRef.current;
    if (!synth) { onDone(); return; }
    synth.cancel();

    // Split into sentences for faster first-word
    const sentences = rawText.match(/[^.!?\n]+[.!?\n]*/g) || [rawText];
    let idx = 0;

    const speakNext = () => {
      if (idx >= sentences.length) { onDone(); return; }
      const clean = cleanForSpeech(sentences[idx++]);
      if (!clean) { speakNext(); return; }

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

      utt.onend = speakNext;
      utt.onerror = speakNext;
      synth.speak(utt);
    };

    speakNext();
  }, [selectedLang]);

  // ─── Send to AI ──────────────────────────────────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) { setAppState("ready"); return; }

    setAppState("thinking");
    setAiResponse("");
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
      speakText(full, () => {
        if (!isLiveRef.current) return;
        setAppState("ready");
        setTranscript("");
        setAiResponse("");
        setNoSpeechHint(false);
      });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setAppState("ready");
    }
  }, [activePersona, sessionId, activeFolder, speakText, onNewMessageSent]);

  // ─── Single-shot recognition (tap = one attempt) ─────────────────────────
  const startOneShot = useCallback(() => {
    if (!isLiveRef.current || isMutedRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (synthRef.current) synthRef.current.cancel();

    const rec = createRecognition(selectedLang);
    if (!rec) {
      setIsSupported(false);
      setErrorMessage("Web Speech API not supported. Please use Chrome on Android or Safari on iOS.");
      setAppState("error");
      return;
    }

    setErrorMessage(null);
    setNoSpeechHint(false);
    setTranscript("");
    liveTranscriptRef.current = "";
    setAppState("recording");

    rec.onresult = (event: any) => {
      // Collect ALL results — both interim and final — for live visual feedback
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interimText += t;
      }
      const combined = (finalText + interimText).trim();
      if (combined) {
        // Show live transcription on screen so user sees it's working
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
      } else if (err === "no-speech") {
        // Only show hint if nothing was captured at all
        if (!liveTranscriptRef.current) {
          setNoSpeechHint(true);
          setAppState("ready");
        }
      } else {
        // For network/audio errors — use whatever was captured
        const captured = liveTranscriptRef.current;
        if (captured && captured.length > 1) {
          sendToAI(captured);
        } else {
          setAppState("ready");
        }
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (appStateRef.current !== "recording") return; // Already processing
      // Use whatever transcript was captured — final OR interim
      const captured = liveTranscriptRef.current;
      if (captured && captured.length > 1) {
        sendToAI(captured);
      } else {
        setNoSpeechHint(true);
        setAppState("ready");
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (_) {
      recognitionRef.current = null;
      setAppState("ready");
    }
  }, [selectedLang, sendToAI]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      isLiveRef.current = true;
      setAppState("ready");
      setTranscript("");
      setAiResponse("");
      setErrorMessage(null);
      setNoSpeechHint(false);
      setIsMuted(false);
      startAnalyzer();
    } else {
      isLiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
      stopAnalyzer();
      setAppState("ready");
    }
    return () => {
      isLiveRef.current = false;
      try { recognitionRef.current?.abort(); } catch (_) {}
      recognitionRef.current = null;
      abortControllerRef.current?.abort();
      synthRef.current?.cancel();
      stopAnalyzer();
    };
  }, [isOpen, selectedLang]);

  // ─── Shake to Exit ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let lastShake = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const tot = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      if (tot > 32 && Date.now() - lastShake > 2000) {
        lastShake = Date.now();
        navigator.vibrate?.([100, 50, 100]);
        isLiveRef.current = false;
        try { recognitionRef.current?.abort(); } catch (_) {}
        synthRef.current?.cancel();
        stopAnalyzer();
        onClose();
      }
    };
    if ("DeviceMotionEvent" in window) window.addEventListener("devicemotion", onMotion);
    return () => { if ("DeviceMotionEvent" in window) window.removeEventListener("devicemotion", onMotion); };
  }, [isOpen, onClose, stopAnalyzer]);

  if (!isOpen) return null;

  // ─── Orb tap handler ─────────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (appState === "thinking") return; // Let AI finish

    if (appState === "speaking") {
      // Interrupt AI speech
      synthRef.current?.cancel();
      setAppState("ready");
      setAiResponse("");
      setTranscript("");
      return;
    }

    if (appState === "recording") {
      // Stop current recording and submit whatever was captured
      try { recognitionRef.current?.stop(); } catch (_) {}
      return;
    }

    // appState === "ready" → start a new single-shot recognition
    startOneShot();
  };

  // Icon and label for center orb
  const orbLabel = {
    ready: "tap",
    recording: "listening",
    thinking: "thinking",
    speaking: "speaking",
    error: "error",
  }[appState];

  const orbRingClass =
    appState === "recording"
      ? "border-indigo-400 shadow-indigo-500/40"
      : appState === "speaking"
      ? "border-emerald-400 shadow-emerald-500/30"
      : appState === "thinking"
      ? "border-yellow-400/60 shadow-yellow-500/20"
      : "border-white/10";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#090a0f] p-6 text-white select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${appState === "recording" ? "bg-indigo-400 animate-pulse" : appState === "speaking" ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
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
            onClick={() => { isLiveRef.current = false; recognitionRef.current?.abort(); synthRef.current?.cancel(); stopAnalyzer(); onClose(); }}
            className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Orb */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10 w-full">
        <div
          onClick={handleOrbTap}
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Ping ring when ready */}
          {appState === "ready" && (
            <div className="absolute inset-0 m-auto w-36 h-36 rounded-full animate-ping bg-indigo-500/10 pointer-events-none" />
          )}

          {/* Center orb circle */}
          <div className={`absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300 ${orbRingClass}`}>
            {appState === "ready" && <Mic size={28} className="text-indigo-400" />}
            {appState === "recording" && (
              <div className="flex flex-col items-center gap-1">
                <Mic size={28} className="text-indigo-300 animate-pulse" />
                <div className="flex gap-0.5 items-end h-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-0.5 bg-indigo-400 rounded-full animate-bounce" style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}
            {appState === "thinking" && <Loader2 size={28} className="text-yellow-400 animate-spin" />}
            {appState === "speaking" && <Sparkles size={28} className="text-emerald-400 animate-pulse" />}
            {appState === "error" && <AlertCircle size={28} className="text-red-400" />}
            <span className="text-[10px] font-semibold tracking-widest uppercase mt-1.5 text-zinc-400">{orbLabel}</span>
          </div>
        </div>

        {/* Error */}
        {(!isSupported || errorMessage) && (
          <div className="mt-4 max-w-sm bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <p className="text-xs text-red-300 mb-3">{errorMessage || "Speech not supported in this browser."}</p>
            <button
              onClick={() => { setErrorMessage(null); setAppState("ready"); }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/20 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 transition-all active:scale-95"
            >
              <RefreshCw size={13} />Retry
            </button>
          </div>
        )}

        {/* Subtitles */}
        {isSupported && !errorMessage && (
          <div className="mt-6 w-full max-w-lg text-center flex flex-col items-center gap-2 px-4">
            {appState === "ready" && !transcript && (
              <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
                {noSpeechHint ? "No speech detected — tap again to retry" : "Tap orb to speak"}
              </p>
            )}
            {transcript && appState !== "ready" && (
              <p className="text-sm font-medium text-indigo-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-w-full">
                "{transcript}"
              </p>
            )}
            {aiResponse && (
              <p className="text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-h-28 overflow-y-auto mt-1">
                {aiResponse}
              </p>
            )}
            {appState === "thinking" && !aiResponse && (
              <p className="text-xs text-yellow-400/70 tracking-widest uppercase animate-pulse">Processing...</p>
            )}
            {appState === "speaking" && (
              <p className="text-xs text-emerald-400/70 tracking-widest uppercase">Tap orb to interrupt</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex items-center justify-center gap-6 z-10 pb-6">
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
            } else {
              setIsMuted(true);
              try { recognitionRef.current?.abort(); } catch (_) {}
              synthRef.current?.cancel();
              setAppState("ready");
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
          onClick={() => { isLiveRef.current = false; try { recognitionRef.current?.abort(); } catch (_) {} synthRef.current?.cancel(); stopAnalyzer(); onClose(); }}
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-red-600/30"
        >
          <PhoneOff size={18} />
          <span>End Live</span>
        </button>
      </div>
    </div>
  );
}
