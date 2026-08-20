import Groq from "groq-sdk";

export const MODEL = "openai/gpt-oss-120b";
export const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

export const MAINTENANCE_MESSAGE =
  "⚠️ System is currently under maintenance due to high traffic capacity. Please try again in a few moments.";

/**
 * Collect all configured Groq API keys in priority order.
 * Supports GROQ_API_KEY, GROQ_API_KEY_BACKUP, and comma-separated GROQ_API_KEY strings.
 */
export function getGroqApiKeys(): string[] {
  const keys: string[] = [];

  const primary = process.env.GROQ_API_KEY;
  if (primary) {
    primary.split(",").map((k) => k.trim()).filter(Boolean).forEach((k) => keys.push(k));
  }

  const backup = process.env.GROQ_API_KEY_BACKUP || process.env.GROQ_API_KEY_SECONDARY;
  if (backup) {
    backup.split(",").map((k) => k.trim()).filter(Boolean).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    });
  }

  const legacy = process.env.CEREBRAS_API_KEY;
  if (legacy && !keys.includes(legacy)) {
    keys.push(legacy.trim());
  }

  return keys;
}

/**
 * Returns an array of Groq SDK clients initialized with available keys.
 */
export function getGroqClients(): Groq[] {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }
  return keys.map((apiKey) => new Groq({ apiKey }));
}

/**
 * Smart Groq Client with automatic Multi-Key Failover & Maintenance fallback.
 * Automatically tries Key 1 -> Key 2 on rate-limit (429) or exhaustion.
 */
export function getGroqClient() {
  const clients = getGroqClients();

  return {
    chat: {
      completions: {
        create: async (params: any) => {
          let lastErr: any = null;

          for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            try {
              return await client.chat.completions.create(params);
            } catch (err: any) {
              const status = err?.status || err?.statusCode || (err?.message?.includes("429") ? 429 : null);
              const isRateLimit = status === 429 || err?.message?.toLowerCase()?.includes("rate limit") || err?.message?.toLowerCase()?.includes("quota");

              console.warn(
                `[Groq Key ${i + 1}/${clients.length} ${isRateLimit ? "Rate Limit Exceeded" : "Failed"}]`,
                err?.message || err
              );

              lastErr = err;

              // If there's another backup key available, failover immediately to next key
              if (i < clients.length - 1) {
                console.log(`[Groq Failover] Automatically switching to backup Key ${i + 2}...`);
                continue;
              }
            }
          }

          console.error("[Groq All API Keys Exhausted]", lastErr);
          throw new Error(MAINTENANCE_MESSAGE);
        },
      },
    },
  } as any;
}

// Backward compatibility alias
export const getCerebrasClient = getGroqClient;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Execute non-streaming response with Multi-Key Failover across all keys and models.
 */
export async function generateResponse(messages: Message[], modelName = MODEL): Promise<string> {
  const clients = getGroqClients();
  const modelsToTry = [modelName, ...FALLBACK_MODELS.filter((m) => m !== modelName)];

  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < clients.length; keyIdx++) {
    const client = clients[keyIdx];

    for (const targetModel of modelsToTry) {
      try {
        const completion = (await client.chat.completions.create({
          model: targetModel,
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 2048,
        })) as any;

        const choice = completion.choices[0]?.message;
        const content = choice?.content?.trim() || choice?.reasoning?.trim() || "";
        if (content) return content;

        return "Task completed successfully.";
      } catch (error: any) {
        console.warn(
          `[Groq Key ${keyIdx + 1}/${clients.length} | Model ${targetModel} Failed]`,
          error?.message || error
        );
        lastError = error;
      }
    }
  }

  console.error("[Groq All Keys & Models Exhausted]", lastError);
  return MAINTENANCE_MESSAGE;
}

/**
 * Execute streaming response with Multi-Key Failover.
 */
export async function generateStreamResponse(messages: Message[], modelName = MODEL, maxTokens = 1024) {
  const clients = getGroqClients();
  const modelsToTry = [modelName, ...FALLBACK_MODELS.filter((m) => m !== modelName)];

  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < clients.length; keyIdx++) {
    const client = clients[keyIdx];

    for (const targetModel of modelsToTry) {
      try {
        const stream = await client.chat.completions.create({
          model: targetModel,
          messages: messages as any,
          temperature: 0.7,
          max_tokens: maxTokens,
          stream: true,
        });

        return stream;
      } catch (error: any) {
        console.warn(
          `[Groq Stream Key ${keyIdx + 1}/${clients.length} | Model ${targetModel} Failed]`,
          error?.message || error
        );
        lastError = error;
      }
    }
  }

  console.error("[Groq Stream All Keys Exhausted]", lastError);
  throw new Error(MAINTENANCE_MESSAGE);
}
