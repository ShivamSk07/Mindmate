"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GitFork, ArrowRight, Sparkles, Copy, Check, Lock, Globe, MessageSquare, AlertCircle } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import type { Message } from "@/types";

export default function PublicSharePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [chatData, setChatData] = useState<{
    id: string;
    title: string;
    author: string;
    persona: string;
    createdAt: string;
    messages: Message[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForking, setIsForking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadSharedChat() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Shared conversation not found");
        }
        const data = await res.json();
        setChatData(data);
      } catch (e: any) {
        setError(e.message || "Failed to load shared conversation");
      } finally {
        setIsLoading(false);
      }
    }
    loadSharedChat();
  }, [id]);

  const handleFork = async () => {
    try {
      setIsForking(true);
      const res = await fetch(`/api/share/${id}/fork`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/share/${id}`);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fork chat");
      }

      const result = await res.json();
      if (result.forkedSessionId) {
        router.push("/chat");
      }
    } catch (e: any) {
      alert(e.message || "Could not fork conversation.");
    } finally {
      setIsForking(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-wide">Loading shared workspace snapshot...</p>
      </div>
    );
  }

  if (error || !chatData) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle size={22} />
        </div>
        <h1 className="text-lg font-semibold text-white mb-2">Conversation Not Found</h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          {error || "This shared conversation might be set to private or was deleted by the owner."}
        </p>
        <Link
          href="/chat"
          className="px-4 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 transition-colors"
        >
          Return to Clarity
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/img/logo.png" alt="Clarity" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Clarity
            </span>
          </Link>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300 max-w-[200px] md:max-w-md truncate">
              {chatData.title}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe size={10} /> Public
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all active:scale-95"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copiedLink ? "Copied Link" : "Copy Link"}</span>
          </button>

          <button
            onClick={handleFork}
            disabled={isForking}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <GitFork size={13} className={isForking ? "animate-spin" : ""} />
            <span>{isForking ? "Forking..." : "Fork & Continue in Workspace"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Banner */}
        <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Shared by <strong className="text-zinc-200">{chatData.author}</strong></span>
              <span>•</span>
              <span>{new Date(chatData.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <p className="text-xs text-zinc-500">
              Read-only snapshot. Click &ldquo;Fork & Continue&rdquo; to branch this conversation into your private account.
            </p>
          </div>
          <button
            onClick={handleFork}
            className="self-start sm:self-auto text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group"
          >
            <span>Branch Solution</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="space-y-6 pt-2">
          {chatData.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              username={chatData.author}
              assistantName={chatData.persona || "Clarity"}
              avatarUrl="/img/logo.png"
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
        <p>Powered by <Link href="/chat" className="text-zinc-400 hover:text-white font-medium underline">Clarity Autonomous Workspace</Link></p>
      </footer>
    </div>
  );
}
