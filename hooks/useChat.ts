"use client";

import { useState, useCallback, useRef } from "react";
import type { Message } from "@/types";

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

    // 1. Add user message immediately (optimistic UI)
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

      // 2. Insert an empty assistant response that we will update
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
        
        // Keep the last item in the buffer as it might be incomplete
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                
                if (data.content) {
                  accumulatedText += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedText }
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

      // Remove optimistic messages on error
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
