import Cerebras from "@cerebras/cerebras_cloud_sdk";

export const MODEL = "gpt-oss-120b";
export const FALLBACK_MODELS = ["gpt-oss-120b"];

export function getCerebrasClient() {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY environment variable is not configured.");
  }
  return new Cerebras({ apiKey });
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateResponse(messages: Message[], modelName = MODEL): Promise<string> {
  const client = getCerebrasClient();
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
      console.warn(`[Cerebras Model ${targetModel} Failed]`, error?.message || error);
      lastError = error;
    }
  }

  console.error("[Cerebras All Models Error]", lastError);
  throw new Error(lastError?.message || "AI service unavailable");
}

export async function generateStreamResponse(messages: Message[], modelName = MODEL, maxTokens = 1024) {
  const client = getCerebrasClient();
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
      console.warn(`[Cerebras Stream Model ${targetModel} Failed]`, error?.message || error);
      lastError = error;
    }
  }

  console.error("[Cerebras Stream All Models Error]", lastError);
  throw new Error(lastError?.message || "AI streaming unavailable");
}

