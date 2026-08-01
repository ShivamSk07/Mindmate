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

type ModeState = "idle" | "listening" | "thinking" | "speaking" | "error";

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
  const [state, setState] = useState<ModeState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Listening...");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Single persistent recognition instance — never destroy/recreate unless language changes
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSentenceQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const currentChunkRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // All control via refs to avoid stale closures
  const isMutedRef = useRef(false);
  const isLiveActiveRef = useRef(false);
  const isProcessingRef = useRef(false); // true when AI is thinking or TTS is speaking

  // Web Audio API refs (for canvas visualizer only — NOT for VAD start/stop)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioLevelRef = useRef<number>(0);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Canvas Visualizer
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let phase = 0;
    const render = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio || 300;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio || 300;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      ctx.clearRect(0, 0, width, height);
      const targetLevel = audioLevelRef.current;
      phase += 0.04 + targetLevel * 0.08;
      const numRings = 3;
      const baseRadius = Math.min(width, height) * 0.26;
      for (let r = 0; r < numRings; r++) {
        ctx.beginPath();
        const points = 128;
        const ringOffset = r * (Math.PI / 3);
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const noise =
            Math.sin(angle * 4 + phase + ringOffset) * (8 + targetLevel * 35) +
            Math.cos(angle * 6 - phase * 0.8) * (4 + targetLevel * 20);
          const radius = baseRadius + noise;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.5);
        if (r === 0) {
          grad.addColorStop(0, "rgba(99, 102, 241, 0.45)");
          grad.addColorStop(0.6, "rgba(168, 85, 247, 0.25)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        } else if (r === 1) {
          grad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
          grad.addColorStop(0.7, "rgba(99, 102, 241, 0.15)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        } else {
          grad.addColorStop(0, "rgba(236, 72, 153, 0.25)");
          grad.addColorStop(0.8, "rgba(129, 140, 248, 0.1)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = r === 0 ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.15)";
        ctx.stroke();
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isOpen]);

  // Start mic audio stream for visualizer only (no VAD start/stop)
  const startAudioAnalyzer = useCallback(async () => {
    try {
      if (mediaStreamRef.current) return; // already running
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        audioLevelRef.current = Math.min(1, (sum / dataArray.length) / 100);
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
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    audioLevelRef.current = 0;
  }, []);

  // Clean Markdown for TTS
  const cleanMarkdownForSpeech = (rawText: string) =>
    rawText
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#+\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s+/g, "")
      .trim();

  // TTS queue
  const processSentenceQueue = useCallback(() => {
    if (!synthRef.current || currentSentenceQueueRef.current.length === 0 || isSpeakingRef.current) return;
    const nextRaw = currentSentenceQueueRef.current.shift();
    if (!nextRaw) return;
    const cleanText = cleanMarkdownForSpeech(nextRaw);
    if (!cleanText) { if (currentSentenceQueueRef.current.length > 0) processSentenceQueue(); return; }

    isSpeakingRef.current = true;
    isProcessingRef.current = true;
    setState("speaking");
    setStatusText("Speaking...");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.22;
    utterance.pitch = 1.0;
    const voices = synthRef.current.getVoices();
    const langPrefix = selectedLang.split("-")[0];
    const preferredVoice =
      voices.find((v) => v.lang.startsWith(langPrefix) && (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Neural") || v.name.includes("Google"))) ||
      voices.find((v) => v.lang.startsWith(langPrefix)) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      } else {
        // Done speaking — re-arm recognition WITHOUT restarting it
        // (it's already running continuously)
        isProcessingRef.current = false;
        setState("listening");
        setStatusText("Listening...");
        setTranscript("");
        setAiResponse("");
      }
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      } else {
        isProcessingRef.current = false;
        setState("listening");
        setStatusText("Listening...");
        setTranscript("");
        setAiResponse("");
      }
    };
    synthRef.current.speak(utterance);
  }, [selectedLang]);

  // Send to AI
  const sendSpokenTextToAI = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim() || isProcessingRef.current) return;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (synthRef.current) synthRef.current.cancel();

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
            message: textToSend,
            conversation_id: sessionId,
            persona_id: activePersona?.id,
            folder: activeFolder || "",
            mode: "fast",
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("API response error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullAnswer = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6).trim();
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.content) {
                    fullAnswer += data.content;
                    currentChunkRef.current += data.content;
                    setAiResponse(fullAnswer);
                    const matches = currentChunkRef.current.match(/[^.!?\n,;:]+[.!?\n,;:]+/g);
                    if (matches) {
                      for (const s of matches) {
                        currentSentenceQueueRef.current.push(s);
                        currentChunkRef.current = currentChunkRef.current.slice(s.length);
                      }
                      processSentenceQueue();
                    } else if (currentChunkRef.current.length > 35) {
                      currentSentenceQueueRef.current.push(currentChunkRef.current);
                      currentChunkRef.current = "";
                      processSentenceQueue();
                    }
                  }
                } catch (e) {}
              }
            }
          }
        }

        if (currentChunkRef.current.trim()) {
          currentSentenceQueueRef.current.push(currentChunkRef.current.trim());
          currentChunkRef.current = "";
          processSentenceQueue();
        }
        if (onNewMessageSent) onNewMessageSent(textToSend, fullAnswer);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        isProcessingRef.current = false;
        setState("listening");
        setStatusText("Listening...");
      }
    },
    [activePersona, sessionId, activeFolder, processSentenceQueue, onNewMessageSent]
  );

  // ─── CORE: Start ONE persistent recognition instance ────────────────────────
  // On Android, every .start()/.stop() call = beep sound.
  // Solution: use continuous=true, NEVER stop it while listening.
  // When AI is thinking/speaking, we ignore incoming results via isProcessingRef.
  const startRecognitionOnce = useCallback(() => {
    if (recognitionRef.current) return; // already running

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setErrorMessage("Web Speech API not supported. Use Chrome, Edge, or Safari.");
      setState("error");
      return;
    }

    setErrorMessage(null);

    const rec = new SpeechRecognitionClass();
    rec.continuous = true;      // Stay open — no start/stop beep loop on Android
    rec.interimResults = true;
    rec.lang = selectedLang;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setState("listening");
      setStatusText("Listening...");
    };

    rec.onresult = (event: any) => {
      // Ignore results while AI is thinking or TTS is speaking
      if (isProcessingRef.current || isMutedRef.current || !isLiveActiveRef.current) return;

      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interimText += t;
      }

      const currentText = (finalText + interimText).trim();
      if (!currentText) return;

      setTranscript(currentText);

      // Reset silence timer on every result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // If we got a final result, send immediately
      if (finalText.trim().length > 1) {
        silenceTimerRef.current = setTimeout(() => {
          if (!isProcessingRef.current) sendSpokenTextToAI(finalText.trim());
        }, 400);
      } else if (currentText.length > 3) {
        // Interim result — send after 1.5s silence
        silenceTimerRef.current = setTimeout(() => {
          if (!isProcessingRef.current && currentText.length > 1)
            sendSpokenTextToAI(currentText);
        }, 1500);
      }
    };

    rec.onerror = (event: any) => {
      const errType = event.error;
      if (errType === "not-allowed" || errType === "service-not-allowed") {
        setErrorMessage("Microphone access denied. Allow mic in browser settings.");
        setState("error");
        recognitionRef.current = null;
        return;
      }
      // For "no-speech", "audio-capture", "network" — don't destroy; rec stays running
    };

    rec.onend = () => {
      // Android Chrome fires onend even for continuous mode after ~60s silence.
      // Restart ONCE silently (no new instance — same ref reused).
      recognitionRef.current = null;
      if (isLiveActiveRef.current && !isMutedRef.current) {
        setTimeout(() => {
          if (isLiveActiveRef.current && !isMutedRef.current && !recognitionRef.current) {
            startRecognitionOnce();
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      recognitionRef.current = null;
    }
  }, [selectedLang, sendSpokenTextToAI]);

  // Destroy current recognition (on mute/close/language change)
  const destroyRecognition = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (synthRef.current) synthRef.current.cancel();
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Open/close modal
  useEffect(() => {
    if (isOpen) {
      isLiveActiveRef.current = true;
      setTranscript("");
      setAiResponse("");
      setErrorMessage(null);
      setState("listening");
      startAudioAnalyzer();
      startRecognitionOnce();
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

  // Shake to exit
  useEffect(() => {
    if (!isOpen) return;
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      if (total > 32) {
        const now = Date.now();
        if (now - lastShake > 2000) {
          lastShake = now;
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          isLiveActiveRef.current = false;
          destroyRecognition();
          stopAudioAnalyzer();
          onClose();
        }
      }
    };
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window)
      window.addEventListener("devicemotion", handleMotion);
    return () => {
      if (typeof window !== "undefined" && "DeviceMotionEvent" in window)
        window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isOpen, onClose, destroyRecognition, stopAudioAnalyzer]);

  if (!isOpen) return null;

  const handleOrbClick = () => {
    if (isProcessingRef.current) {
      // Interrupt AI
      destroyRecognition();
      if (synthRef.current) synthRef.current.cancel();
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#090a0f] p-6 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide text-zinc-300">
            {activePersona?.name || "Clarity"} Live
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-zinc-300">
            <Globe size={13} className="text-indigo-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#12131a] text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              isLiveActiveRef.current = false;
              destroyRecognition();
              stopAudioAnalyzer();
              onClose();
            }}
            className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Close Live Mode"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Visualizer Orb */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10 w-full">
        <div
          onClick={handleOrbClick}
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer group"
          title="Tap to interrupt"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 border border-white/10 flex flex-col items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-105 backdrop-blur-md">
            {activePersona?.avatarUrl ? (
              <img src={activePersona.avatarUrl} alt={activePersona.name} className="w-14 h-14 rounded-full object-cover border border-white/20" />
            ) : (
              <Sparkles size={28} className="text-indigo-400" />
            )}
            <span className="text-[10px] font-medium tracking-wider text-zinc-400 capitalize mt-1.5">{state}</span>
          </div>
        </div>

        {!isSupported || errorMessage ? (
          <div className="mt-6 max-w-md bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-red-400 font-medium text-xs mb-1">
              <AlertCircle size={16} />
              <span>Speech Engine Issue</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">{errorMessage}</p>
            <button
              onClick={() => { setErrorMessage(null); destroyRecognition(); startRecognitionOnce(); }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 transition-all"
            >
              <RefreshCw size={13} />
              <span>Retry Mic Connection</span>
            </button>
          </div>
        ) : (
          <div className="mt-8 w-full max-w-lg text-center min-h-[60px] flex flex-col items-center justify-center px-4">
            {transcript && (
              <p className="text-sm font-medium text-indigo-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 text-center backdrop-blur-md max-w-full">
                "{transcript}"
              </p>
            )}
            {aiResponse && (
              <p className="text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 text-center backdrop-blur-md max-h-24 overflow-y-auto scrollbar-thin mt-1.5">
                {aiResponse}
              </p>
            )}
            {!transcript && !aiResponse && (
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
              startRecognitionOnce();
            } else {
              setIsMuted(true);
              destroyRecognition();
              setState("idle");
              setStatusText("Muted");
            }
          }}
          className={`p-4 rounded-full transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-white/[0.08] border border-white/[0.1] text-zinc-300 hover:text-white"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={() => {
            isLiveActiveRef.current = false;
            destroyRecognition();
            stopAudioAnalyzer();
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
