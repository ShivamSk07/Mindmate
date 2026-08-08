"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Languages, Palette, Sliders, HardDrive, Download, Trash2, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState("English");
  const [themePreference, setThemePreference] = useState("dark");
  const [bubbleStyle, setBubbleStyle] = useState("modern");
  const [fontSize, setFontSize] = useState("15");
  
  const [memoryBox, setMemoryBox] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.username) setUsername(data.username);
      if (data.profile) {
        setLanguage(data.profile.language || "English");
        setThemePreference(data.profile.themePreference || "dark");
        setBubbleStyle(data.profile.bubbleStyle || "modern");
        setFontSize(data.profile.fontSize || "15");
        setMemoryBox(data.profile.memoryVault || "");
        applyLiveTheme(data.profile.themePreference || "dark");
      }
    } catch (e) {
      console.error("Failed to load settings data", e);
    } finally {
      setLoading(false);
    }
  };

  const applyLiveTheme = (theme: string) => {
    if (typeof document !== "undefined") {
      document.documentElement.className = "dark";
      document.body.setAttribute("data-theme", "dark");
    }
  };

  const handleThemeChange = (val: string) => {
    setThemePreference(val);
    applyLiveTheme(val);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          themePreference,
          fontSize,
          language,
          bubbleStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveMemory = async () => {
    try {
      await fetch("/api/memory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory_vault: memoryBox }),
      });
      alert("Memory updated successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleWipeMemory = async () => {
    if (confirm("Wipe all memory context?")) {
      setMemoryBox("");
      try {
        await fetch("/api/memory/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memory_vault: "" }),
        });
        alert("Memory wiped!");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Clear all conversations? This cannot be undone.")) {
      try {
        await fetch("/api/history?clearAll=true", { method: "DELETE" });
        alert("Conversations deleted!");
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#020204] text-[#f8fafc]">
        <div className="text-xs font-semibold text-zinc-400">Settings</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-[#000000] text-[#f2f2f7] relative overflow-hidden">

      {/* Settings Navigation Sidebar — Apple Style */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#222226] p-6 flex flex-row md:flex-col gap-4 items-center md:items-start bg-[#111113] relative z-10 flex-shrink-0">
        <Link
          href="/chat"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-[#f2f2f7] md:hidden"
        >
          <ArrowLeft size={16} />
        </Link>
        <Link href="/chat" className="flex items-center gap-2">
          <img src="/img/branding.png" alt="Clarity" className="h-5 object-contain" />
        </Link>
        <div className="hidden md:flex flex-col gap-1.5 w-full mt-6">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#8e8e93] hover:text-white hover:bg-[#1c1c1e] rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> Back to Chat
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl">
            <User size={14} className="text-[#0a84ff]" /> Settings & Profile
          </div>
        </div>
      </aside>

      {/* Settings Options Scroll area */}
      <main className="flex-1 h-full min-h-0 overflow-y-auto p-6 md:p-12 max-w-3xl relative z-10 scrollbar-thin bg-[#000000]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-[#8e8e93] mt-1">
            Manage your account preferences, theme, and personalization.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs mb-6">
            Preferences saved successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section: Profile settings */}
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-[#2c2c2e] border border-[#3a3a3c] rounded-full flex items-center justify-center text-sm font-semibold text-white uppercase">
              {username ? username.slice(0, 2) : "CL"}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white uppercase tracking-wide">Username</label>
              <p className="text-[10px] text-[#8e8e93]">Your display name inside the chat interface.</p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full mt-1.5 p-3 rounded-xl text-xs outline-none bg-[#111113] border border-[#2c2c2e] focus:border-[#3a3a3c] text-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white uppercase tracking-wide">Language</label>
              <p className="text-[10px] text-[#94a3b8]">Preferred language for interface and default companion behavior.</p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl text-xs outline-none input-premium text-white transition-all appearance-none cursor-pointer"
              >
                <option value="English">English (US)</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          {/* Section: Appearance preferences */}
          <div className="glass-premium rounded-2xl p-5 md:p-6 space-y-4 shadow-[0_10px_32px_rgba(0,0,0,0.3)]">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#64748b]">Appearance</h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white uppercase tracking-wide">App Theme</label>
              <p className="text-[10px] text-[#94a3b8]">Dark mode is always active for a premium experience.</p>
              <select
                disabled
                value="dark"
                className="w-full mt-1.5 p-3 rounded-xl text-xs outline-none input-premium text-[#64748b] cursor-not-allowed"
              >
                <option value="dark">Dark Theme (Always Active)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white uppercase tracking-wide">Chat Bubble Style</label>
              <p className="text-[10px] text-[#94a3b8]">Renders messages in selected styling.</p>
              <select
                value={bubbleStyle}
                onChange={(e) => setBubbleStyle(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl text-xs outline-none input-premium text-white transition-all appearance-none cursor-pointer"
              >
                <option value="modern">Modern UI (Rounded)</option>
                <option value="minimal">Minimal (Outline border)</option>
                <option value="classic">Classic (No border)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-white uppercase tracking-wide">Font Size ({fontSize}px)</label>
              <p className="text-[10px] text-[#94a3b8]">Adjust typography size for optimal reading.</p>
              <input
                type="range"
                min="13"
                max="22"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full mt-3 cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-[#64748b] font-semibold mt-1.5">
                <span>13px</span>
                <span>22px</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveLoading}
            className="w-full md:w-auto px-6 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-150 active:scale-95 transition-all shadow-[0_4px_16px_rgba(255,255,255,0.08)] btn-shimmer"
          >
            {saveLoading ? "Saving..." : "Save Preferences"}
          </button>
        </form>

        {/* Section: Memory Vault */}
        <div className="glass-premium rounded-2xl p-5 md:p-6 mt-6 space-y-4 shadow-[0_10px_32px_rgba(0,0,0,0.3)]">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#64748b]">Memory Vault</h3>
          <p className="text-[10px] text-[#94a3b8] leading-relaxed">
            Clarity automatically tracks key context items from your chat queries. Review, edit, or delete them here.
          </p>
          <textarea
            value={memoryBox}
            onChange={(e) => setMemoryBox(e.target.value)}
            className="w-full h-28 bg-[#050508]/85 border border-[rgba(255,255,255,0.04)] rounded-xl p-3 text-xs outline-none text-[#a5b4fc] font-mono resize-none focus:border-indigo-500/40 transition-all shadow-inner"
            placeholder="No memories stored yet..."
          />
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleSaveMemory}
              className="flex-1 py-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.05)] text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-98"
            >
              Update Memory
            </button>
            <button
              onClick={handleWipeMemory}
              className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all active:scale-98"
            >
              Wipe Memory
            </button>
          </div>
        </div>

        {/* Section: Danger Zone backup & deletes */}
        <div className="glass-premium border-[rgba(239,68,68,0.25)] rounded-2xl p-5 md:p-6 mt-6 space-y-4 shadow-[0_10px_32px_rgba(0,0,0,0.3)]">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-red-400">Data & Privacy</h3>
          <p className="text-[10px] text-[#94a3b8]">
            Export backups of your data or permanently wipe your chat session history.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href="/api/export/all"
              download
              className="w-full text-center py-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.05)] text-white text-xs font-semibold rounded-xl hover:text-opacity-80 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Download size={13} className="text-[#94a3b8]" /> Export All Chats
            </a>
            <button
              onClick={handleClearHistory}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Trash2 size={13} /> Clear All Chat History
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
