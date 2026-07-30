"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, PhoneOff, Disc } from "lucide-react";

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

type ModeState = "idle" | "listening" | "thinking" | "speaking";

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
  const [statusText, setStatusText] = useState("Gemini Live");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSentenceQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const currentChunkRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioLevelRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Canvas Liquid Fluid Wave Visualizer (Gemini Live Style)
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

      // Draw Glass Fluid Waves
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

        // Gemini Glass Gradient Colors
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

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  // Stop Web Audio mic analyzer
  const stopAudioAnalyzer = useCallback(() => {
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

  // Setup REAL Web Audio API Microphone Analyzer
  const startAudioAnalyzer = useCallback(async () => {
    try {
      stopAudioAnalyzer();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
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
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        audioLevelRef.current = Math.min(1, avg / 100);

        requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.warn("Could not access mic audio stream", err);
    }
  }, [stopAudioAnalyzer]);

  // Stop all speech recognition & TTS
  const stopAllVoice = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isSpeakingRef.current = false;
  }, []);

  // Clean Markdown formatting for clean human-like speech output
  const cleanMarkdownForSpeech = (rawText: string) => {
    return rawText
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#+\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s+/g, "")
      .trim();
  };

  // Process sentence queue for ultra-fast, snappy speech synthesis
  const processSentenceQueue = useCallback(() => {
    if (
      !synthRef.current ||
      currentSentenceQueueRef.current.length === 0 ||
      isSpeakingRef.current
    ) {
      return;
    }

    const nextRawSentence = currentSentenceQueueRef.current.shift();
    if (!nextRawSentence) return;

    const cleanText = cleanMarkdownForSpeech(nextRawSentence);
    if (!cleanText || cleanText.length === 0) {
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      }
      return;
    }

    isSpeakingRef.current = true;
    setState("speaking");
    setStatusText("Speaking");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.18; // Snappy conversational speed
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Online") ||
          v.name.includes("Neural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Karen") ||
          v.name.includes("Daniel") ||
          v.name.includes("Alex") ||
          v.name.includes("Serena"))
    ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      } else {
        setState("listening");
        setStatusText("Listening...");
        startListening();
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (currentSentenceQueueRef.current.length > 0) {
        processSentenceQueue();
      } else {
        startListening();
      }
    };

    synthRef.current.speak(utterance);
  }, [activePersona?.name]);

  // Send user text to AI
  const sendSpokenTextToAI = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim()) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

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
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Failed request");

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
                      for (const sentence of matches) {
                        currentSentenceQueueRef.current.push(sentence);
                        currentChunkRef.current = currentChunkRef.current.slice(sentence.length);
                      }
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

        if (onNewMessageSent) {
          onNewMessageSent(textToSend, fullAnswer);
        }

      } catch (err: any) {
        if (err.name === "AbortError") return;
        setStatusText("Error processing voice");
        setTimeout(() => startListening(), 2000);
      }
    },
    [activePersona, sessionId, activeFolder, processSentenceQueue, onNewMessageSent]
  );

  // Start continuous Web Speech recognition
  const startListening = useCallback(() => {
    if (isMuted) return;

    stopAllVoice();
    startAudioAnalyzer();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusText("Speech recognition unsuported");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setState("listening");
      setStatusText("Listening...");
    };

    rec.onresult = (event: any) => {
      let finalStr = "";
      let interimStr = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalStr += text + " ";
        } else {
          interimStr += text;
        }
      }

      const currentText = (finalStr + interimStr).trim();
      if (currentText) {
        setTranscript(currentText);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentText.trim().length > 1) {
            sendSpokenTextToAI(currentText.trim());
          }
        }, 1200);
      }
    };

    rec.onerror = (err: any) => {
      if (err.error !== "no-speech") console.error("Rec error:", err);
    };

    rec.onend = () => {
      if (state === "listening" && isOpen && !isMuted) {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {}
  }, [isMuted, stopAllVoice, startAudioAnalyzer, state, isOpen, sendSpokenTextToAI]);

  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setAiResponse("");
      startListening();
    } else {
      stopAllVoice();
      stopAudioAnalyzer();
      setState("idle");
    }
    return () => {
      stopAllVoice();
      stopAudioAnalyzer();
    };
  }, [isOpen]);

  // Shake sensor feature while in Live Mode -> Exits Live Mode
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
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          stopAllVoice();
          stopAudioAnalyzer();
          onClose();
        }
      }
    };
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handleMotion);
    }
    return () => {
      if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, [isOpen, onClose, stopAllVoice, stopAudioAnalyzer]);

  if (!isOpen) return null;

  const handleOrbClick = () => {
    if (state === "speaking" || state === "thinking") {
      stopAllVoice();
      setTranscript("");
      setAiResponse("");
      startListening();
    } else if (state === "listening" && transcript.trim()) {
      sendSpokenTextToAI(transcript.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-[#090a0f] p-6 text-white select-none transition-all duration-300">
      
      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-zinc-300">
            {activePersona?.name || "Clarity"} Live
          </span>
        </div>

        <button
          onClick={() => {
            stopAllVoice();
            stopAudioAnalyzer();
            onClose();
          }}
          className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all active:scale-95"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Full-Screen Fluid Visualizer */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10 w-full">
        <div
          onClick={handleOrbClick}
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center cursor-pointer group"
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          
          {/* Center Minimal Avatar Indicator */}
          <div className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-black/60 border border-white/10 flex flex-col items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-105 backdrop-blur-md">
            {activePersona?.avatarUrl ? (
              <img
                src={activePersona.avatarUrl}
                alt={activePersona.name}
                className="w-14 h-14 rounded-full object-cover border border-white/20"
              />
            ) : (
              <Sparkles size={28} className="text-indigo-400" />
            )}
            <span className="text-[10px] font-medium tracking-wider text-zinc-400 capitalize mt-1.5">
              {state}
            </span>
          </div>
        </div>

        {/* Live Subtitle / Transcript */}
        <div className="mt-8 w-full max-w-lg text-center min-h-[60px] flex flex-col items-center justify-center px-4">
          {transcript && (
            <p className="text-sm font-medium text-indigo-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 text-center backdrop-blur-md animate-fade-in max-w-full">
              “{transcript}”
            </p>
          )}

          {aiResponse && (
            <p className="text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5 text-center backdrop-blur-md max-h-24 overflow-y-auto scrollbar-thin animate-fade-in mt-1.5">
              {aiResponse}
            </p>
          )}

          {!transcript && !aiResponse && (
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
              {statusText}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex items-center justify-center gap-6 z-10 pb-6">
        <button
          onClick={() => {
            if (isMuted) {
              setIsMuted(false);
              startListening();
            } else {
              setIsMuted(true);
              stopAllVoice();
              stopAudioAnalyzer();
              setState("idle");
              setStatusText("Muted");
            }
          }}
          className={`p-4 rounded-full transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-white/[0.08] border border-white/[0.1] text-zinc-300 hover:text-white"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={() => {
            stopAllVoice();
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
