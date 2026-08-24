import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateStreamResponse, getCerebrasClient, MODEL } from "@/lib/cerebras";
import { searchWeb } from "@/lib/search";
import { needsWebSearch, extractSearchQuery, detectSearchIntentWithAI } from "@/lib/intent";
import { buildNormalPrompt, buildSearchAugmentedPrompt, buildDocumentAndUrlAugmentedPrompt } from "@/lib/prompts";
import { generateFluxImage, isImageGenerationRequest } from "@/lib/imageGen";
import { extractUrlsFromText, scrapeUrlContent } from "@/lib/scraper";
import { runAutoCleanupIfNeeded } from "@/lib/cleanup";

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

    const client = getCerebrasClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: extractPrompt }],
      temperature: 0.1,
      max_tokens: 150,
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

let personasSeeded = false;
async function seedDefaultPersonasIfNeeded() {
  if (personasSeeded) return;
  try {
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
    personasSeeded = true;
  } catch (e) {
    console.warn("Seeding default personas failed", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      conversation_id,
      persona_id,
      folder,
      force_search,
      mode,
      tone,
      length,
      document_content,
      document_name,
      document_id,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Trigger auto cleanup of expired documents (2 min TTL) in background
    runAutoCleanupIfNeeded().catch(() => {});

    let conv;
    // 1. Get or Create Session (Instant without blocking LLM call)
    if (conversation_id) {
      conv = await prisma.session.findFirst({
        where: { id: conversation_id, userId: user.userId },
        include: { activePersona: true }
      });
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      const fallbackTitle = message.trim().slice(0, 24) || "New Conversation";
      await seedDefaultPersonasIfNeeded();

      let activePersonaId = persona_id || null;
      if (!activePersonaId) {
        const defaultPersona = await prisma.persona.findFirst({
          where: { name: "Clarity", isCustom: false }
        });
        activePersonaId = defaultPersona ? defaultPersona.id : null;
      }

      conv = await prisma.session.create({
        data: {
          title: fallbackTitle,
          userId: user.userId,
          activePersonaId: activePersonaId,
          folder: folder || ""
        },
        include: { activePersona: true }
      });
    }

    // 2. Save User Message asynchronously
    const saveUserMsgPromise = prisma.message.create({
      data: {
        role: "user",
        content: message,
        sessionId: conv.id,
      }
    });

    // 3. Fetch Profile & Message History in parallel (with safe fallback)
    let profile: any = null;
    try {
      profile = await prisma.userProfile.findUnique({ where: { userId: user.userId } });
    } catch (e) {
      console.warn("[Profile query fallback]", e);
    }

    const [historyMessages] = await Promise.all([
      prisma.message.findMany({
        where: { sessionId: conv.id },
        orderBy: { createdAt: "asc" },
        take: 6
      }),
      saveUserMsgPromise
    ]);

    const memoryVault = profile?.memoryVault || "";
    const chatHistory = historyMessages.map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    }));

    // 4. Intercept Image Generation & Slash Commands
    let userQuery = message.trim();
    let finalForceSearch = force_search;

    const imageReq = isImageGenerationRequest(userQuery);
    if (imageReq.isImage && imageReq.prompt) {
      const imgResult = await generateFluxImage(imageReq.prompt);
      const assistantText = `[Widget: image url="${imgResult.imageUrl}" prompt="${imgResult.prompt}"]`;

      // Save assistant message to database
      await prisma.message.create({
        data: {
          role: "assistant",
          content: assistantText,
          sessionId: conv.id,
        },
      });

      // Stream instant response
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantText })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: conv.id })}\n\n`));
          controller.close();
        },
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (userQuery.startsWith("/summarize")) {
      userQuery = "Summarize our conversation so far in concise bullet points. Focus on key topics discussed.";
    } else if (userQuery.startsWith("/rewrite")) {
      const textToRewrite = userQuery.substring(8).trim();
      if (textToRewrite) {
        userQuery = `Please rewrite, refine, and polish this text to make it extremely clear and well-written:\n\n"${textToRewrite}"`;
      } else {
        userQuery = "Rewrite the last response to make it more refined and polished.";
      }
    } else if (userQuery.startsWith("/research") || userQuery.startsWith("/search")) {
      const researchQuery = userQuery.replace(/^\/(research|search)\s*/i, "").trim();
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

    // 5. Document Context Resolution
    let attachedDocument: { name: string; content: string } | undefined = undefined;
    if (document_content && document_content.trim()) {
      attachedDocument = {
        name: document_name || "Uploaded Document",
        content: document_content.trim(),
      };
    } else {
      // Check if session has a recently uploaded document
      try {
        const latestDoc = await prisma.document.findFirst({
          where: { sessionId: conv.id },
          orderBy: { createdAt: "desc" },
        });
        if (latestDoc && latestDoc.content) {
          attachedDocument = {
            name: latestDoc.filename,
            content: latestDoc.content,
          };
        }
      } catch (docErr) {
        console.warn("[Document lookup fallback]:", docErr);
      }
    }

    // 6. Live Web Link / URL Detection & Scraping (e.g. LinkedIn, GitHub, Websites, Articles)
    const detectedUrls = extractUrlsFromText(userQuery);
    const scrapedUrlsData: Array<{ url: string; title: string; content: string }> = [];

    if (detectedUrls.length > 0) {
      console.log(`[Live Link Scraper Triggered for ${detectedUrls.length} URL(s)]`);
      const scrapePromises = detectedUrls.slice(0, 3).map(u => scrapeUrlContent(u, 6000));
      const scrapedResults = await Promise.all(scrapePromises);

      for (const res of scrapedResults) {
        if (res.success && res.content) {
          scrapedUrlsData.push(res);
          sources.push({
            title: res.title || res.url,
            url: res.url,
          });
          searched = true;
        }
      }
    }

    // 7. Autonomous Real-Time Web Search Trigger (AI + Heuristic)
    let searchDecision = { needsSearch: false, searchQuery: userQuery };
    if (finalForceSearch) {
      searchDecision = { needsSearch: true, searchQuery: extractSearchQuery(userQuery) };
    } else if (detectedUrls.length === 0 && !attachedDocument) {
      searchDecision = await detectSearchIntentWithAI(userQuery);
    }

    let searchResults: any[] = [];
    if (searchDecision.needsSearch) {
      console.log(`[Autonomous AI Search Triggered]: "${searchDecision.searchQuery}"`);

      // Execute DuckDuckGo Web Search
      let results = await searchWeb(searchDecision.searchQuery, 5);

      // If 0 results, retry with a shorter/simpler query (strip filler words)
      if (results.length === 0) {
        const simpleQuery = searchDecision.searchQuery
          .replace(/forecast|today|2026|2025|current|latest/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (simpleQuery.length > 3) {
          console.log(`[Search Retry with simpler query]: "${simpleQuery}"`);
          results = await searchWeb(simpleQuery, 5);
        }
      }

      if (results.length > 0) {
        searched = true;
        searchResults = results;
        for (const r of results) {
          sources.push({ title: r.title, url: r.url });
        }
      }
    }

    // 8. Build Unified Augmented Prompt
    if (attachedDocument || scrapedUrlsData.length > 0 || searchResults.length > 0) {
      queryMessages = buildDocumentAndUrlAugmentedPrompt(userQuery, {
        document: attachedDocument,
        scrapedUrls: scrapedUrlsData,
        searchResults: searchResults,
        chatHistory,
        personaName,
        personaPrompt,
        memoryVault,
      });
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
      targetModel = MODEL;
      maxTokens = 350;
      queryMessages.push({
        role: "system",
        content: "STRICT RULE: Be extremely brief, direct, and answer in 1-2 sentences maximum."
      });
    } else if (mode === "deep") {
      targetModel = MODEL;
      maxTokens = 4096;
      queryMessages.push({
        role: "system",
        content: "STRICT RULE: Start your response by detailing your step-by-step thinking process inside <thinking>...</thinking> tags. Once you finish thinking, write your final response after the </thinking> tag."
      });
    }

    // Inject Tone & Length directives
    let toneInstruction = "";
    if (tone === "friendly") {
      toneInstruction = "\nTONE POLICY: Respond in a warm, welcoming, and friendly manner.";
    } else if (tone === "professional") {
      toneInstruction = "\nTONE POLICY: Respond in a highly professional, formal, and authoritative manner.";
    } else if (tone === "funny") {
      toneInstruction = "\nTONE POLICY: Respond in a humorous, lighthearted, and witty manner.";
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

    // Inject current date-time context
    queryMessages.push({
      role: "system",
      content: `CURRENT DATETIME CONTEXT:\nThe current time is ${new Date().toString()} (UTC ISO: ${new Date().toISOString()}). Use this for latest context.`
    });

    // 6. Generate and Stream SSE Response (Ultra Fast Stream)
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

          // Save assistant message to database
          await prisma.message.create({
            data: {
              role: "assistant",
              content: fullResponse,
              searched,
              sources: sources.length > 0 ? sources : undefined,
              sessionId: conv.id
            }
          });

          // Memory extraction in background (non-blocking)
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
          const errorMsg = err?.message || "Error generating AI response.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
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
      { error: error?.message || "Failed to process chat request." },
      { status: 500 }
    );
  }
}
