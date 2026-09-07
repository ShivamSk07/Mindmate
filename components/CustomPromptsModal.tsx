"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Sparkles, BookOpen, Check, Command, Terminal, Code, FileText, AlertCircle } from "lucide-react";

export interface CustomPrompt {
  id: string;
  name: string;
  command: string; // e.g. "/audit"
  description: string;
  template: string;
  category?: string;
  createdAt: number;
}

const DEFAULT_PROMPTS: CustomPrompt[] = [
  {
    id: "default-audit",
    name: "Code Security Audit",
    command: "/audit",
    description: "Audit code for security flaws, memory leaks & performance",
    template: "Perform a comprehensive security, vulnerability, and performance audit on the following code. Point out exact risk areas, CVE patterns, and provide refactored secure solutions:\n\n{text}",
    category: "Code",
    createdAt: Date.now() - 30000,
  },
  {
    id: "default-unittest",
    name: "Generate Unit Tests",
    command: "/test",
    description: "Generate 100% coverage unit tests with edge cases",
    template: "Write complete, production-ready unit tests covering all success cases, edge cases, error conditions, and mocks for the following code:\n\n{text}",
    category: "Code",
    createdAt: Date.now() - 20000,
  },
  {
    id: "default-refactor",
    name: "Refactor Clean Code",
    command: "/refactor",
    description: "Refactor for SOLID principles, readability & speed",
    template: "Refactor this code to follow clean code best practices, SOLID principles, optimal time/space complexity, and modern TypeScript standards:\n\n{text}",
    category: "Code",
    createdAt: Date.now() - 10000,
  },
  {
    id: "default-explain",
    name: "Explain Architecture",
    command: "/explain",
    description: "Break down architecture and data flow step-by-step",
    template: "Explain the architecture, design pattern, and execution flow of this code in clean, intuitive steps with key takeaways:\n\n{text}",
    category: "Analysis",
    createdAt: Date.now(),
  },
];

interface CustomPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (template: string) => void;
  onPromptsUpdated?: (prompts: CustomPrompt[]) => void;
}

export function CustomPromptsModal({ isOpen, onClose, onSelectPrompt, onPromptsUpdated }: CustomPromptsModalProps) {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCommand, setFormCommand] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTemplate, setFormTemplate] = useState("");
  const [formCategory, setFormCategory] = useState("Code");
  const [errorMessage, setErrorMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clarity_custom_prompts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrompts(parsed);
          onPromptsUpdated?.(parsed);
          return;
        }
      }
      setPrompts(DEFAULT_PROMPTS);
      localStorage.setItem("clarity_custom_prompts", JSON.stringify(DEFAULT_PROMPTS));
      onPromptsUpdated?.(DEFAULT_PROMPTS);
    } catch (e) {
      setPrompts(DEFAULT_PROMPTS);
    }
  }, []);

  const saveToStorage = (updated: CustomPrompt[]) => {
    setPrompts(updated);
    try {
      localStorage.setItem("clarity_custom_prompts", JSON.stringify(updated));
    } catch (e) {}
    onPromptsUpdated?.(updated);
  };

  const handleStartCreate = () => {
    setEditingPrompt(null);
    setFormName("");
    setFormCommand("/");
    setFormDescription("");
    setFormTemplate("");
    setFormCategory("Code");
    setErrorMessage("");
    setIsCreating(true);
  };

  const handleStartEdit = (prompt: CustomPrompt) => {
    setEditingPrompt(prompt);
    setFormName(prompt.name);
    setFormCommand(prompt.command);
    setFormDescription(prompt.description);
    setFormTemplate(prompt.template);
    setFormCategory(prompt.category || "Code");
    setErrorMessage("");
    setIsCreating(true);
  };

  const handleSave = () => {
    setErrorMessage("");
    const trimmedName = formName.trim();
    let trimmedCommand = formCommand.trim().toLowerCase();
    const trimmedDesc = formDescription.trim();
    const trimmedTemplate = formTemplate.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter a prompt name.");
      return;
    }

    if (!trimmedCommand.startsWith("/")) {
      trimmedCommand = "/" + trimmedCommand;
    }

    if (trimmedCommand.length < 2 || /\s/.test(trimmedCommand)) {
      setErrorMessage("Command must start with '/' and contain no spaces (e.g. /audit).");
      return;
    }

    if (!trimmedTemplate) {
      setErrorMessage("Please enter the prompt template instructions.");
      return;
    }

    // Check for duplicate command (if not editing self)
    const duplicate = prompts.find(
      (p) => p.command.toLowerCase() === trimmedCommand && p.id !== editingPrompt?.id
    );
    if (duplicate) {
      setErrorMessage(`The command "${trimmedCommand}" is already in use by "${duplicate.name}".`);
      return;
    }

    if (editingPrompt) {
      const updated = prompts.map((p) =>
        p.id === editingPrompt.id
          ? {
              ...p,
              name: trimmedName,
              command: trimmedCommand,
              description: trimmedDesc || "Custom prompt shortcut",
              template: trimmedTemplate,
              category: formCategory,
            }
          : p
      );
      saveToStorage(updated);
    } else {
      const newPrompt: CustomPrompt = {
        id: "prompt_" + Math.random().toString(36).substring(7),
        name: trimmedName,
        command: trimmedCommand,
        description: trimmedDesc || "Custom prompt shortcut",
        template: trimmedTemplate,
        category: formCategory,
        createdAt: Date.now(),
      };
      saveToStorage([newPrompt, ...prompts]);
    }

    setIsCreating(false);
    setEditingPrompt(null);
  };

  const handleDelete = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id);
    saveToStorage(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0e0e12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Terminal size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Custom Slash Commands & Prompt Library</h2>
              <p className="text-xs text-zinc-400">Create reusable shortcuts like <span className="text-indigo-400 font-mono">/audit</span> or <span className="text-indigo-400 font-mono">/test</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {isCreating ? (
            /* Create / Edit Form */
            <div className="space-y-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {editingPrompt ? "Edit Slash Command" : "New Custom Slash Command"}
                </span>
                <span className="text-[11px] text-zinc-500">
                  Tip: Use <code className="text-zinc-300 font-mono">{"{text}"}</code> in template for dynamic user input
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Prompt Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Code Security Audit"
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Slash Trigger</label>
                  <input
                    type="text"
                    value={formCommand}
                    onChange={(e) => setFormCommand(e.target.value)}
                    placeholder="/audit"
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-indigo-400 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Deep security and performance audit"
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Prompt Template Instructions</label>
                <textarea
                  rows={5}
                  value={formTemplate}
                  onChange={(e) => setFormTemplate(e.target.value)}
                  placeholder="Perform an audit on the following code and list vulnerabilities:\n\n{text}"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Check size={13} />
                  <span>Save Command</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header Action */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  {prompts.length} Available Commands
                </span>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-colors"
                >
                  <Plus size={13} />
                  <span>New Slash Prompt</span>
                </button>
              </div>

              {/* Prompts List */}
              <div className="grid grid-cols-1 gap-2.5">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/70 hover:border-zinc-700 rounded-xl transition-all"
                  >
                    <div className="space-y-1 pr-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {prompt.command}
                        </span>
                        <span className="text-xs font-medium text-white truncate">{prompt.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{prompt.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 md:mt-0 flex-shrink-0">
                      {onSelectPrompt && (
                        <button
                          onClick={() => {
                            onSelectPrompt(prompt.template);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          Use in Chat
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(prompt)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/20 flex items-center justify-between text-xs text-zinc-500">
          <span>Type <code className="text-zinc-400 font-mono">/</code> in chat bar to trigger custom prompts instantly.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
