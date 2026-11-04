"use client";

import React, { useState } from "react";
import { FolderTree, FileCode, Download, Copy, Check, Eye, Code, X, ChevronRight, File } from "lucide-react";

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

interface MultiFileWorkspaceProps {
  title?: string;
  files: ProjectFile[];
}

export function parseMultiFiles(text: string): { files: ProjectFile[]; cleanText: string } {
  const files: ProjectFile[] = [];
  if (!text) return { files: [], cleanText: text };

  // Match: ```language file="path/filename.ext" or filename="path/filename.ext" or // filename: path/filename.ext
  const fileBlockRegex = /```(\w+)?\s*(?:file|filename|path)=["']?([a-zA-Z0-9_\-\./\\]+)["']?\s*\n([\s\S]*?)```/gi;
  let match;
  let cleanText = text;

  while ((match = fileBlockRegex.exec(text)) !== null) {
    const lang = (match[1] || "text").toLowerCase();
    const fileName = match[2].trim();
    const code = match[3].trim();

    if (fileName && code) {
      files.push({
        name: fileName,
        language: lang,
        content: code,
      });
    }
  }

  // Also match fallback: ### File: filename.ext \n ```language ... ```
  if (files.length === 0) {
    const fallbackRegex = /(?:###|\*\*)\s*(?:File|Filename):\s*`?([a-zA-Z0-9_\-\./\\]+)`?\s*(?:\*\*)?\s*\n```(\w+)?\s*\n([\s\S]*?)```/gi;
    let fbMatch;
    while ((fbMatch = fallbackRegex.exec(text)) !== null) {
      const fileName = fbMatch[1].trim();
      const lang = (fbMatch[2] || "text").toLowerCase();
      const code = fbMatch[3].trim();
      if (fileName && code) {
        files.push({
          name: fileName,
          language: lang,
          content: code,
        });
      }
    }
  }

  return { files, cleanText };
}

export default function MultiFileWorkspace({ title = "Multi-File Project Workspace", files }: MultiFileWorkspaceProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!files || files.length <= 1) return null;

  const currentFile = files[activeFileIndex] || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      // Dynamically load JSZip or create download package
      for (const file of files) {
        const blob = new Blob([file.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.split("/").pop() || file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full my-3.5 bg-[#0a0a0f] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Top Header */}
      <div className="h-10 px-4 bg-[#0f0f16] border-b border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FolderTree size={14} className="text-indigo-400" />
          <span className="font-semibold text-zinc-200">{title}</span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
            {files.length} Files
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors border border-white/[0.04]"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy Active"}</span>
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] text-white font-medium shadow-sm transition-all"
          >
            <Download size={11} />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#07070b] border-b border-white/[0.04] overflow-x-auto scrollbar-none">
        {files.map((file, idx) => {
          const isActive = idx === activeFileIndex;
          return (
            <button
              key={idx}
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? "bg-zinc-800/90 text-white shadow-sm border border-white/[0.08]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
              }`}
            >
              <FileCode size={12} className={isActive ? "text-indigo-400" : "text-zinc-600"} />
              <span>{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active File Editor/Viewer */}
      <div className="p-4 bg-[#050508] max-h-[420px] overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed scrollbar-thin">
        <pre className="whitespace-pre overflow-x-auto">
          <code>{currentFile.content}</code>
        </pre>
      </div>
    </div>
  );
}
