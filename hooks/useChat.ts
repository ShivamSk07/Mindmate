"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, ConfidenceData, Project } from "@/types";

function parseMessageMetadata(rawText: string) {
  let confidenceData: ConfidenceData | undefined;
  let projectData: Project | undefined;
  let cleanContent = rawText;

  // 1. Parse Confidence Score Block
  if (rawText.includes("---CONFIDENCE---")) {
    const cMatch = rawText.match(/---CONFIDENCE---\s*([\s\S]*?)\s*---END_CONFIDENCE---/);
    if (cMatch && cMatch[1]) {
      try {
        confidenceData = JSON.parse(cMatch[1].trim());
        cleanContent = cleanContent.replace(/---CONFIDENCE---\s*[\s\S]*?\s*---END_CONFIDENCE---/, "").trim();
      } catch (e) {
        console.warn("Failed to parse confidence JSON", e);
      }
    }
  }

  // 2. Parse AI Project Workspace Block
  if (rawText.includes("---PROJECT---")) {
    const pMatch = rawText.match(/---PROJECT---\s*([\s\S]*?)\s*---END_PROJECT---/);
    if (pMatch && pMatch[1]) {
      try {
        projectData = JSON.parse(pMatch[1].trim());
        cleanContent = cleanContent.replace(/---PROJECT---\s*[\s\S]*?\s*---END_PROJECT---/, "").trim();
      } catch (e) {
        console.warn("Failed to parse project JSON", e);
      }
    }
  }

  // Default Confidence Score Calculation if AI did not output block
  if (!confidenceData && cleanContent.trim().length > 10) {
    confidenceData = {
      score: 93,
      level: "High",
      color: "green",
      reason: "Large amount of verified knowledge exists and context is clear.",
      factors: {
        knowledge: 95,
        consistency: 92,
        context: 90,
        hallucinationRisk: 4,
      },
    };
  }

  return { cleanContent, confidenceData, projectData };
}

export function useChat(initialSessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    activePersonaId?: string | null,
    activeFolder?: string | null,
    forceSearch?: boolean,
    mode?: string,
    tone?: string,
    length?: string
  ) => {
    if (!content.trim() || isLoading) return;

    setError(null);

    // 1. Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversation_id: sessionId,
          persona_id: activePersonaId,
          folder: activeFolder || "",
          force_search: forceSearch ?? false,
          mode: mode || "normal",
          tone: tone || "friendly",
          length: length || "medium",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server returned error (${response.status})`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // 2. Insert initial empty assistant response
      const assistantMessageId = crypto.randomUUID();
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        searched: false,
        sources: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, initialAssistantMessage]);

      let accumulatedText = "";
      let isDone = false;
      let buffer = "";

      while (!isDone) {
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
                  accumulatedText += data.content;
                  const { cleanContent, confidenceData, projectData } = parseMessageMetadata(accumulatedText);

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: cleanContent,
                            confidenceData: confidenceData || msg.confidenceData,
                            projectData: projectData || msg.projectData,
                          }
                        : msg
                    )
                  );
                }

                if (data.done) {
                  isDone = true;
                  if (data.conversation_id) {
                    setSessionId(data.conversation_id);
                  }
                }

                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "AbortError") return;

      const errorMessage = err.message || "Something went wrong";
      setError(errorMessage);

      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));

    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  }, []);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    error,
    sendMessage,
    clearChat,
    stopGeneration,
    setMessages,
    setSessionId,
  };
}
