import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const MODEL = "gpt-oss-120b";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateResponse(messages: Message[], modelName = MODEL): Promise<string> {
  try {
    const completion = await cerebras.chat.completions.create({
      model: modelName,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1024,
    }) as any;

    return completion.choices[0]?.message?.content ?? "Sorry, kuch issue aaya. Dobara try karo.";
  } catch (error) {
    console.error("[Cerebras Error]", error);
    throw new Error("AI service unavailable");
  }
}

export async function generateStreamResponse(messages: Message[], modelName = MODEL, maxTokens = 1024) {
  try {
    const stream = await cerebras.chat.completions.create({
      model: modelName,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error("[Cerebras Stream Error]", error);
    throw new Error("AI streaming unavailable");
  }
}
