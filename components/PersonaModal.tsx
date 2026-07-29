"use client";

import { useState, useEffect } from "react";

interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  tone: string;
  colorTheme: string;
  isCustom: boolean;
}

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPersona?: Persona | null;
}

const COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#10b981", label: "Emerald" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#64748b", label: "Slate" },
];

export function PersonaModal({ isOpen, onClose, onSuccess, editingPersona }: PersonaModalProps) {
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("Custom");
  const [colorTheme, setColorTheme] = useState("#6366f1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPersona) {
      setName(editingPersona.name);
      setSystemPrompt(editingPersona.systemPrompt);
      setTone(editingPersona.tone);
      setColorTheme(editingPersona.colorTheme || "#6366f1");
    } else {
      setName("");
      setSystemPrompt("");
      setTone("Custom");
      setColorTheme("#6366f1");
    }
    setError(null);
  }, [editingPersona, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) {
      setError("Name and System Prompt are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const url = editingPersona 
      ? `/api/personas/edit/${editingPersona.id}` 
      : "/api/personas/create";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          system_prompt: systemPrompt.trim(),
          tone: tone.trim(),
          colorTheme,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save persona");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="bg-[#121214] border border-[#27272a] rounded-xl w-full max-w-[480px] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            {editingPersona ? "Edit Custom Persona" : "Create Custom Persona"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-neutral-500 hover:text-white transition-colors text-xs font-bold"
          >
            x
          </button>
        </header>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Persona Name
            </label>
            <input
              type="text"
              placeholder="e.g. Code Debugger, Copywriter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#0c0c0e] border border-[#27272a] text-white rounded-lg p-2.5 text-xs outline-none focus:border-neutral-500 transition-colors"
              maxLength={40}
              required
            />
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Tone / Style
            </label>
            <input
              type="text"
              placeholder="e.g. Technical & Direct, Empathetic"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#0c0c0e] border border-[#27272a] text-white rounded-lg p-2.5 text-xs outline-none focus:border-neutral-500 transition-colors"
              maxLength={30}
            />
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Color Theme
            </label>
            <div className="flex gap-3 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorTheme(c.value)}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    colorTheme === c.value
                      ? "border-white scale-110 shadow-sm"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              System Prompt (Instructions)
            </label>
            <textarea
              placeholder="Write detailed instructions on how this persona should behave..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isLoading}
              className="w-full h-36 bg-[#0c0c0e] border border-[#27272a] text-white rounded-lg p-2.5 text-xs outline-none focus:border-neutral-500 transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          {/* Actions */}
          <footer className="flex gap-3 mt-4 pt-4 border-t border-[#27272a]">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-grow bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {isLoading ? "Saving..." : editingPersona ? "Save Changes" : "Create Persona"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-grow bg-transparent hover:bg-neutral-900 border border-[#27272a] text-neutral-400 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
