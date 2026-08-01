"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, PhoneOff, Globe, AlertCircle, RefreshCw } from "lucide-react";

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

type ModeState = "idle" | "tap_to_start" | "listening" | "thinking" | "speaking" | "error";

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
  const [state, setState] = useState<ModeState>("tap_to_start");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Tap orb to start");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Whether the user has given the first gesture unlock
  const [gestureUnlocked, setGestureUnlocked] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSentenceQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const currentChunkRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Control refs — avoid stale closures in callbacks
  const isMutedRef = useRef(false);
  const isLiveActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const gestureUnlockedRef = useRef(false);

  // Web Audio refs (for visualizer only)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioLevelRef = useRef<number>(0);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { gestureUnlockedRef.current = gestureUnlocked; }, [gestureUnlocked]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // ─── Canvas Visualizer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let phase = 0;
    const render = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      const lvl = audioLevelRef.current;
      phase += 0.04 + lvl * 0.08;
      const baseR = Math.min(W, H) * 0.26;
      const ringColors = [
        ["rgba(99,102,241,0.45)", "rgba(168,85,247,0.25)"],
        ["rgba(56,189,248,0.35)", "rgba(99,102,241,0.15)"],
        ["rgba(236,72,153,0.25)", "rgba(129,140,248,0.1)"],
      ];
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        const off = r * (Math.PI / 3);
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          const n = Math.sin(a * 4 + phase + off) * (8 + lvl * 35) + Math.cos(a * 6 - phase * 0.8) * (4 + lvl * 20);
          const rad = baseR + n;
          const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR * 1.5);
        g.addColorStop(0, ringColors[r][0]);
        g.addColorStop(1, ringColors[r][1]);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = r === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)";
        ctx.stroke();
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isOpen]);

  // ─── Audio Analyzer (visualizer — no gesture required) ─────────────────────
  const startAudioAnalyzer = useCallback(async () => {
    try {
      if (mediaStreamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      if (ctx.state === "suspended") await ctx.resume();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        audioLevelRef.current = Math.min(1, (sum / data.length) / 100);
        requestAnimationFrame(loop);
      };
      loop();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone access denied. Please allow mic access.");
        setState("error");
      }
    }
  }, []);

  const stopAudioAnalyzer = useCallback(() => {
    analyserRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (audioCtxRef.current?.state !== "closed") audioCtxRef.current?.close();
    audioCtxRef.current = null;
    audioLevelRef.current = 0;
  }, []);

  // ─── TTS ────────────────────────────────────────────────────────────────────
  const cleanForSpeech = (raw: string) =>
    raw.replace(/```[\s\S]*?```/g, "").replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
      .replace(/#+\s+/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s+/g, "").trim();

  // Forward-declared so processSentenceQueue can call startRecognitionOnce
  const startRecognitionOnceRef = useRef<() => void>(() => {});

  const processSentenceQueue = useCallback(() => {
    if (!synthRef.current || currentSentenceQueueRef.current.length === 0 || isSpeakingRef.current) return;
    const raw = currentSentenceQueueRef.current.shift();
    if (!raw) return;
    const clean = cleanForSpeech(raw);
    if (!clean) { if (currentSentenceQueueRef.current.length > 0) processSentenceQueue(); return; }

    isSpeakingRef.current = true;
    isProcessingRef.current = true;
    setState("speaking");
    setStatusText("Speaking...");

    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.2;
    utt.pitch = 1.0;
    const voices = synthRef.current.getVoices();
    const lp = selectedLang.split("-")[0];
    utt.voice =
      voices.find(v => v.lang.startsWith(lp) && /Natural|Online|Neural|Google/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith(lp)) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0] || null;

    const afterSpeak = () => {
      isSpeakingRef.current = false;
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      } else {
        isProcessingRef.current = false;
        setState("listening");
        setStatusText("Listening...");
        setTranscript("");
        // Restart recognition after AI finishes speaking
        // This is called from TTS onend — NOT a direct user gesture,
        // but Android allows it because AudioContext is already unlocked.
        startRecognitionOnceRef.current();
      }
    };
    utt.onend = afterSpeak;
    utt.onerror = afterSpeak;
    synthRef.current.speak(utt);
  }, [selectedLang]);

  // ─── Destroy Recognition ────────────────────────────────────────────────────
  const destroyRecognition = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    abortControllerRef.current?.abort();
    synthRef.current?.cancel();
    isSpeakingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  // ─── Send to AI ─────────────────────────────────────────────────────────────
  const sendSpokenTextToAI = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    destroyRecognition();
    isProcessingRef.current = true;
    isSpeakingRef.current = false;
    setState("thinking");
    setStatusText("Thinking...");
    setAiResponse("");
    currentSentenceQueueRef.current = [];
    currentChunkRef.current = "";

    try {
      abortControllerRef.current = new AbortController();
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
      const dec = new TextDecoder("utf-8");
      let full = "", buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.substring(6).trim();
          if (!dataStr) continue;
          try {
            const d = JSON.parse(dataStr);
            if (d.content) {
              full += d.content;
              currentChunkRef.current += d.content;
              setAiResponse(full);
              const chunk = currentChunkRef.current;
              const matches = chunk.match(/[^.!?\n,;:]+[.!?\n,;:]+/g);
              if (matches) {
                matches.forEach(s => {
                  currentSentenceQueueRef.current.push(s);
                  currentChunkRef.current = currentChunkRef.current.slice(s.length);
                });
                processSentenceQueue();
              } else if (chunk.length > 35) {
                currentSentenceQueueRef.current.push(chunk);
                currentChunkRef.current = "";
                processSentenceQueue();
              }
            }
          } catch (_) {}
        }
      }

      if (currentChunkRef.current.trim()) {
        currentSentenceQueueRef.current.push(currentChunkRef.current.trim());
        currentChunkRef.current = "";
        processSentenceQueue();
      }

      onNewMessageSent?.(text, full);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      isProcessingRef.current = false;
      setState("listening");
      setStatusText("Listening...");
      startRecognitionOnceRef.current();
    }
  }, [activePersona, sessionId, activeFolder, processSentenceQueue, onNewMessageSent, destroyRecognition]);

  // ─── Core: Start Recognition (must be called from user gesture OR after first unlock) ──
  const startRecognitionOnce = useCallback(() => {
    if (recognitionRef.current || isProcessingRef.current || !isLiveActiveRef.current || isMutedRef.current) return;

    const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecClass) {
      setIsSupported(false);
      setErrorMessage("Web Speech API not supported. Please use Chrome on Android or Safari on iOS.");
      setState("error");
      return;
    }

    setErrorMessage(null);
    const rec = new SpeechRecClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = selectedLang;

    rec.onstart = () => {
      setState("listening");
      setStatusText("Listening...");
    };

    rec.onresult = (event: any) => {
      if (isProcessingRef.current || isMutedRef.current || !isLiveActiveRef.current) return;

      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      const trimmed = text.trim();
      if (!trimmed) return;

      setTranscript(trimmed);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (!isProcessingRef.current && trimmed.length > 1) {
          sendSpokenTextToAI(trimmed);
        }
      }, 700);
    };

    rec.onerror = (event: any) => {
      const err = event.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setErrorMessage("Microphone access denied. Please allow mic in browser settings.");
        setState("error");
        recognitionRef.current = null;
        return;
      }
      // no-speech / audio-capture / network — rec stays alive or will onend-restart
    };

    rec.onend = () => {
      recognitionRef.current = null;
      // Auto-restart only if gesture was already unlocked
      if (isLiveActiveRef.current && !isMutedRef.current && !isProcessingRef.current && gestureUnlockedRef.current) {
        setTimeout(() => {
          if (isLiveActiveRef.current && !isMutedRef.current && !isProcessingRef.current && !recognitionRef.current) {
            startRecognitionOnceRef.current();
          }
        }, 250);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (_) {
      recognitionRef.current = null;
    }
  }, [selectedLang, sendSpokenTextToAI]);

  // Keep the ref up to date so TTS onend / onend auto-restart can call the latest version
  useEffect(() => {
    startRecognitionOnceRef.current = startRecognitionOnce;
  }, [startRecognitionOnce]);

  // ─── Modal Open/Close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      isLiveActiveRef.current = true;
      isProcessingRef.current = false;
      gestureUnlockedRef.current = false;
      setGestureUnlocked(false);
      setTranscript("");
      setAiResponse("");
      setErrorMessage(null);
      setIsMuted(false);
      setState("tap_to_start");
      setStatusText("Tap orb to start");
      // Start visualizer ONLY (no recognition — needs user gesture on Android)
      startAudioAnalyzer();
    } else {
      isLiveActiveRef.current = false;
      destroyRecognition();
      stopAudioAnalyzer();
      setState("idle");
    }
    return () => {
      isLiveActiveRef.current = false;
      destroyRecognition();
      stopAudioAnalyzer();
    };
  }, [isOpen, selectedLang]);

  // ─── Shake to Exit ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      if (total > 32 && Date.now() - lastShake > 2000) {
        lastShake = Date.now();
        navigator.vibrate?.([100, 50, 100]);
        isLiveActiveRef.current = false;
        destroyRecognition();
        stopAudioAnalyzer();
        onClose();
      }
    };
    if ("DeviceMotionEvent" in window) window.addEventListener("devicemotion", handleMotion);
    return () => { if ("DeviceMotionEvent" in window) window.removeEventListener("devicemotion", handleMotion); };
  }, [isOpen, onClose, destroyRecognition, stopAudioAnalyzer]);

  if (!isOpen) return null;

  // ─── Orb Tap Handler ────────────────────────────────────────────────────────
  const handleOrbTap = () => {
    if (state === "tap_to_start" || (!gestureUnlocked && !isProcessingRef.current)) {
      // FIRST TAP = gesture unlock → starts recognition on Android safely
      setGestureUnlocked(true);
      gestureUnlockedRef.current = true;
      setState("listening");
      setStatusText("Listening...");
      startRecognitionOnce();
      return;
    }

    if (transcript.trim() && !isProcessingRef.current) {
      sendSpokenTextToAI(transcript.trim());
    } else if (isProcessingRef.current) {
      // Interrupt AI
      destroyRecognition();
      isProcessingRef.current = false;
      isSpeakingRef.current = false;
      currentSentenceQueueRef.current = [];
      setTranscript("");
      setAiResponse("");
      setState("listening");
      setStatusText("Listening...");
      startRecognitionOnce();
    }
  };

  const isTapToStart = state === "tap_to_start" || !gestureUnlocked;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#090a0f] p-6 text-white select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${gestureUnlocked ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
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
            onClick={() => { isLiveActiveRef.current = false; destroyRecognition(); stopAudioAnalyzer(); onClose(); }}
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
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {/* Center glow ring — pulsing if tap_to_start */}
          {isTapToStart && (
            <div className="absolute inset-0 m-auto w-32 h-32 rounded-full animate-ping bg-indigo-500/20 pointer-events-none" />
          )}

          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 border border-white/10 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-transform group-hover:scale-105">
            {isTapToStart ? (
              <>
                <Mic size={28} className="text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-300 mt-1.5">tap</span>
              </>
            ) : activePersona?.avatarUrl ? (
              <>
                <img src={activePersona.avatarUrl} alt={activePersona.name} className="w-14 h-14 rounded-full object-cover border border-white/20" />
                <span className="text-[10px] font-medium tracking-wider text-zinc-400 capitalize mt-1.5">{state}</span>
              </>
            ) : (
              <>
                <Sparkles size={28} className="text-indigo-400" />
                <span className="text-[10px] font-medium tracking-wider text-zinc-400 capitalize mt-1.5">{state}</span>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {(!isSupported || errorMessage) && (
          <div className="mt-6 max-w-md bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-red-400 font-medium text-xs mb-1">
              <AlertCircle size={16} />
              <span>Speech Engine Issue</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">{errorMessage}</p>
            <button
              onClick={() => {
                setErrorMessage(null);
                setGestureUnlocked(true);
                gestureUnlockedRef.current = true;
                destroyRecognition();
                startRecognitionOnce();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 transition-all"
            >
              <RefreshCw size={13} />
              <span>Retry Mic</span>
            </button>
          </div>
        )}

        {/* Subtitles */}
        {isSupported && !errorMessage && (
          <div className="mt-8 w-full max-w-lg text-center min-h-[60px] flex flex-col items-center justify-center px-4">
            {isTapToStart && (
              <p className="text-sm font-medium text-zinc-400 animate-pulse">
                Tap the orb above to start listening
              </p>
            )}
            {!isTapToStart && transcript && (
              <p className="text-sm font-medium text-indigo-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-w-full">
                "{transcript}"
              </p>
            )}
            {!isTapToStart && aiResponse && (
              <p className="text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 backdrop-blur-md max-h-24 overflow-y-auto mt-1.5">
                {aiResponse}
              </p>
            )}
            {!isTapToStart && !transcript && !aiResponse && (
              <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">{statusText}</p>
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
              if (gestureUnlockedRef.current) startRecognitionOnce();
            } else {
              setIsMuted(true);
              destroyRecognition();
              setState(gestureUnlocked ? "idle" : "tap_to_start");
              setStatusText("Muted");
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
          onClick={() => { isLiveActiveRef.current = false; destroyRecognition(); stopAudioAnalyzer(); onClose(); }}
          className="flex items-center gap-2 px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-red-600/30"
        >
          <PhoneOff size={18} />
          <span>End Live</span>
        </button>
      </div>
    </div>
  );
}
