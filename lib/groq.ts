import Groq from "groq-sdk";

export const MODEL = "openai/gpt-oss-120b";
export const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }
  return new Groq({ apiKey });
}

// Backward compatibility alias
export const getCerebrasClient = getGroqClient;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateResponse(messages: Message[], modelName = MODEL): Promise<string> {
  const client = getGroqClient();
  const modelsToTry = [modelName, ...FALLBACK_MODELS.filter((m) => m !== modelName)];

  let lastError: any = null;
  for (const targetModel of modelsToTry) {
    try {
      const completion = (await client.chat.completions.create({
        model: targetModel,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 1024,
      })) as any;

      return completion.choices[0]?.message?.content ?? "Sorry, kuch issue aaya. Dobara try karo.";
    } catch (error: any) {
      console.warn(`[Groq Model ${targetModel} Failed]`, error?.message || error);
      lastError = error;
    }
  }

  console.error("[Groq All Models Error]", lastError);
  throw new Error(lastError?.message || "AI service unavailable");
}

export async function generateStreamResponse(messages: Message[], modelName = MODEL, maxTokens = 1024) {
  const client = getGroqClient();
  const modelsToTry = [modelName, ...FALLBACK_MODELS.filter((m) => m !== modelName)];

  let lastError: any = null;
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
      console.warn(`[Groq Stream Model ${targetModel} Failed]`, error?.message || error);
      lastError = error;
    }
  }

  console.error("[Groq Stream All Models Error]", lastError);
  throw new Error(lastError?.message || "AI streaming unavailable");
}
