import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateResponse, generateStreamResponse, MODEL } from "@/lib/cerebras";
import { searchWeb } from "@/lib/search";
import { needsWebSearch, extractSearchQuery } from "@/lib/intent";
import { buildNormalPrompt, buildSearchAugmentedPrompt } from "@/lib/prompts";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

// Helper function to extract and update memory in the background
async function extractAndUpdateMemory(userId: string, userMessage: string, assistantReply: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) return;

    const mVault = profile.memoryVault || "";
    const extractPrompt =
      "You are an information extraction expert. Below is the current 'Memory Vault' of user details and the latest chat exchange. " +
      "Update the memory vault with NEW important facts about the user (name, location, habits, likes, personal details). " +
      `\n\n### CURRENT MEMORY:\n${mVault}\n\n` +
      `### LATEST USER MSG: ${userMessage}\n` +
      `### ASSISTANT REPLY: ${assistantReply}\n\n` +
      "CRITICAL: Output ONLY the updated list of facts as concise bullet points. No conversational text. If no new info, repeat current memory.";

    const completion = await cerebras.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: extractPrompt }],
      temperature: 0.1,
    }) as any;

    const newMemory = completion.choices[0]?.message?.content?.trim() || "";
    if (newMemory && newMemory.length > 5) {
      await prisma.userProfile.update({
        where: { userId },
        data: { memoryVault: newMemory }
      });
    }
  } catch (error) {
    console.error("[Memory Extraction Error]", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversation_id, persona_id, folder, force_search, mode, tone, length } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    let conv;
    // 1. Get or Create Session (Conversation)
    if (conversation_id) {
      conv = await prisma.session.findFirst({
        where: { id: conversation_id, userId: user.userId },
        include: { activePersona: true }
      });
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // Smart Title Generation
      let smartTitle = "New Conversation";
      try {
        const titleRes = await cerebras.chat.completions.create({
          messages: [
            {
              role: "user",
              content: `Generate a very short 2-4 word title for this message. No quotes, no markdown: ${message}`,
            },
          ],
          model: MODEL,
          temperature: 0.3,
        }) as any;
        smartTitle = titleRes.choices[0]?.message?.content?.trim().replace(/"/g, "") || "New Conversation";
      } catch (err: any) {
        if (err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("rate")) {
          smartTitle = "Under Maintenance";
        }
      }

const DEFAULT_PERSONAS = [
  {
    id: "mindmate-default-1",
    name: "Clarity",
    tone: "Friendly",
    colorTheme: "#fafafa",
    systemPrompt: "You are Clarity, a premium AI companion. Help the user reflect, think, and explore ideas with depth.",
    isCustom: false,
  },
  {
    id: "mindmate-default-2",
    name: "Code Mentor",
    tone: "Technical & Direct",
    colorTheme: "#a1a1aa",
    systemPrompt: "You are a senior software engineering mentor. Provide clean, well-documented, correct code solutions.",
    isCustom: false,
  },
  {
    id: "mindmate-default-3",
    name: "Aria",
    tone: "Empathetic & Caring",
    colorTheme: "#71717a",
    systemPrompt: "You are Aria, an empathetic, understanding listener. Offer warm, supportive responses.",
    isCustom: false,
  }
];

async function seedDefaultPersonas() {
  for (const def of DEFAULT_PERSONAS) {
    await prisma.persona.upsert({
      where: { id: def.id },
      update: {
        name: def.name,
        tone: def.tone,
        colorTheme: def.colorTheme,
        systemPrompt: def.systemPrompt,
        isCustom: false,
      },
      create: {
        id: def.id,
        name: def.name,
        tone: def.tone,
        colorTheme: def.colorTheme,
        systemPrompt: def.systemPrompt,
        isCustom: false,
      }
    });
  }
}

      // Ensure default personas are seeded
      await seedDefaultPersonas();

      // Check if selected persona exists
      let activePersonaId = persona_id || null;
      if (!activePersonaId) {
        const defaultPersona = await prisma.persona.findFirst({
          where: { name: "Clarity", isCustom: false }
        });
        activePersonaId = defaultPersona ? defaultPersona.id : null;
      }

      conv = await prisma.session.create({
        data: {
          title: smartTitle,
          userId: user.userId,
          activePersonaId: activePersonaId,
          folder: folder || ""
        },
        include: { activePersona: true }
      });
    }

    // 2. Save User Message
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        sessionId: conv.id,
      }
    });

    // 3. Fetch User Profile for Memory Vault
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId }
    });
    const memoryVault = profile?.memoryVault || "";

    // 4. Fetch Message History (last 10 messages)
    const historyMessages = await prisma.message.findMany({
      where: { sessionId: conv.id },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    const chatHistory = historyMessages.map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    }));

    // 5. Intercept Slash Commands
    let userQuery = message.trim();
    let finalForceSearch = force_search;

    if (userQuery.startsWith("/summarize")) {
      userQuery = "Summarize our conversation so far in concise bullet points. Focus on key topics discussed.";
    } else if (userQuery.startsWith("/rewrite")) {
      const textToRewrite = userQuery.substring(8).trim();
      if (textToRewrite) {
        userQuery = `Please rewrite, refine, and polish this text to make it extremely clear and well-written:\n\n"${textToRewrite}"`;
      } else {
        userQuery = "Rewrite the last response to make it more refined and polished.";
      }
    } else if (userQuery.startsWith("/research")) {
      const researchQuery = userQuery.substring(9).trim();
      if (researchQuery) {
        userQuery = researchQuery;
        finalForceSearch = true;
      }
    }

    let searched = false;
    let sources: Array<{ title: string; url: string }> = [];
    let queryMessages;

    const personaName = conv.activePersona?.name || "Clarity";
    const personaPrompt = conv.activePersona?.systemPrompt || "Friendly and supportive assistant.";

    if (finalForceSearch || needsWebSearch(userQuery)) {
      let searchQuery = "";
      
      const wordCount = userQuery.split(/\s+/).length;
      const isSimpleQuery = wordCount <= 4 && 
        !userQuery.toLowerCase().includes("kya") && 
        !userQuery.toLowerCase().includes("kaun") && 
        !userQuery.toLowerCase().includes("kab") && 
        !userQuery.toLowerCase().includes("kahan");

      if (isSimpleQuery) {
        searchQuery = extractSearchQuery(userQuery);
        console.log(`[Search] Bypassed LLM query optimizer for simple query: "${searchQuery}"`);
      } else {
        try {
          const queryRes = await cerebras.chat.completions.create({
            model: MODEL,
            messages: [
              {
                role: "system",
                content: "You are a search query optimizer. Given the user's message, translate it into a short, clean, 2-4 word English search engine query. Return only the query itself with no quotes, punctuation, or filler words.",
              },
              {
                role: "user",
                content: userQuery,
              }
            ],
            temperature: 0.1,
            max_tokens: 20,
          }) as any;
          searchQuery = queryRes.choices[0]?.message?.content?.trim().replace(/"/g, "") || "";
        } catch (err) {
          console.error("LLM search query optimization failed, using fallback:", err);
        }
      }

      if (!searchQuery) {
        searchQuery = extractSearchQuery(userQuery);
      }

      console.log(`[Search] Optimised query: "${searchQuery}"`);
      const results = await searchWeb(searchQuery, 5);

      if (results.length > 0) {
        searched = true;
        sources = results.map(r => ({ title: r.title, url: r.url }));
        queryMessages = buildSearchAugmentedPrompt(
          userQuery,
          results,
          chatHistory,
          personaName,
          personaPrompt,
          memoryVault
        );
      } else {
        queryMessages = buildNormalPrompt(
          userQuery,
          chatHistory,
          personaName,
          personaPrompt,
          memoryVault
        );
      }
    } else {
      queryMessages = buildNormalPrompt(
        userQuery,
        chatHistory,
        personaName,
        personaPrompt,
        memoryVault
      );
    }

    // Determine model and limits based on mode
    let targetModel = MODEL;
    let maxTokens = 1024;

    if (mode === "fast") {
      targetModel = "gemma-4-31b";
      maxTokens = 512;
    } else if (mode === "deep") {
      targetModel = MODEL;
      maxTokens = 4096;

      // Inject thinking instructions for deep mode
      queryMessages.push({
        role: "system",
        content: "STRICT RULE: Start your response by detailing your step-by-step thinking process inside <thinking>...</thinking> tags. Once you finish thinking, write your final response after the </thinking> tag. Do not skip the thinking block."
      });
    }

    // Inject Tone & Length directives
    let toneInstruction = "";
    if (tone === "friendly") {
      toneInstruction = "\nTONE POLICY: Respond in a warm, welcoming, and friendly manner.";
    } else if (tone === "professional") {
      toneInstruction = "\nTONE POLICY: Respond in a highly professional, formal, and authoritative manner.";
    } else if (tone === "funny") {
      toneInstruction = "\nTONE POLICY: Respond in a humorous, lighthearted, and witty manner with a couple of jokes.";
    } else if (tone === "direct") {
      toneInstruction = "\nTONE POLICY: Respond in a direct, concise, and no-nonsense manner.";
    }

    let lengthInstruction = "";
    if (length === "short") {
      lengthInstruction = "\nLENGTH POLICY: Keep your response extremely short and concise (max 2-3 sentences).";
    } else if (length === "detailed") {
      lengthInstruction = "\nLENGTH POLICY: Provide a comprehensive, detailed, and thoroughly explained answer.";
    }

    if (toneInstruction || lengthInstruction) {
      queryMessages.push({
        role: "system",
        content: `ADHERENCE RULES:${toneInstruction}${lengthInstruction}`
      });
    }

    // Retrieve Document RAG Context
    try {
      const sessionDocs = await prisma.document.findMany({
        where: { sessionId: conv.id },
        include: { chunks: true },
      });

      if (sessionDocs.length > 0) {
        const stopwords = new Set(["this", "that", "with", "from", "your", "what", "have", "about", "here"]);
        const keywords = userQuery
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((word: string) => word.length > 3 && !stopwords.has(word));

        const scoredChunks = sessionDocs
          .flatMap(d => d.chunks.map(c => ({ chunk: c, filename: d.filename })))
          .map((item: any) => {
            let score = 0;
            const contentLower = item.chunk.content.toLowerCase();
            for (const word of keywords) {
              if (contentLower.includes(word)) score += 1;
            }
            return { ...item, score };
          })
          .filter((item: any) => item.score > 0 || keywords.length === 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5);

        if (scoredChunks.length > 0) {
          const ragContext = scoredChunks
            .map(item => `[File: ${item.filename}]\n${item.chunk.content}`)
            .join("\n\n---\n\n");

          queryMessages.push({
            role: "system",
            content: `RELEVANT DOCUMENT CONTEXT FROM UPLOADED FILES:\n${ragContext}\n\nUse the above context to answer the user's questions about their uploaded files. Answer in natural Hindi, Hinglish, or English matching the user's query language. Cite the document filename when referencing facts from it.`
          });
        }
      }
    } catch (ragErr) {
      console.error("[RAG Retrieval Failed]", ragErr);
    }

    // Inject current date-time context for reminder scheduling
    queryMessages.push({
      role: "system",
      content: `CURRENT DATETIME CONTEXT:\nThe current time is ${new Date().toString()} (UTC ISO: ${new Date().toISOString()}). Use this to calculate absolute datetimes for task scheduling.`
    });

    // 6. Generate and Stream SSE Response
    const stream = await generateStreamResponse(queryMessages, targetModel, maxTokens);
    const encoder = new TextEncoder();
    const userId = user.userId;

    const customStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Parse out task scheduling triggers if present
          let cleanAssistantResponse = fullResponse;
          const scheduleRegex = /\[ScheduleTask:\s*Type="([^"]+)"\s+RunAt="([^"]+)"\s+Details="([^"]+)"\]/i;
          const match = fullResponse.match(scheduleRegex);
          if (match) {
            const taskType = match[1];
            const runAtStr = match[2];
            const details = match[3];
            try {
              const runAt = new Date(runAtStr);
              await prisma.scheduledTask.create({
                data: {
                  taskType,
                  runAt,
                  details,
                  sessionId: conv.id,
                }
              });
              console.log(`[Reminders] Successfully scheduled task: ${details} at ${runAt}`);
              cleanAssistantResponse = fullResponse.replace(scheduleRegex, "").trim();
            } catch (err) {
              console.error("[Reminders] Failed to parse and schedule task:", err);
            }
          }

          // Save assistant message to database
          await prisma.message.create({
            data: {
              role: "assistant",
              content: cleanAssistantResponse,
              searched,
              sources: sources.length > 0 ? sources : undefined,
              sessionId: conv.id
            }
          });

          // Trigger Memory Vault update in background
          // Note: We don't block the stream response on memory extraction
          extractAndUpdateMemory(userId, message, fullResponse);

          // Update Session modified timestamp
          await prisma.session.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() }
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: conv.id })}\n\n`));
          controller.close();

        } catch (err: any) {
          console.error("SSE stream error", err);
          const maintMsg = "Server is under maintenance. Please try again in a few minutes.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: maintMsg })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(
      { error: "Server is under maintenance. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
