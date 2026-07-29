import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_PERSONAS = [
  {
    id: "mindmate-default-1",
    name: "Clarity",
    tone: "Friendly",
    colorTheme: "#6366f1",
    systemPrompt: "You are Clarity, a premium AI companion. Help the user reflect, think, and explore ideas with depth.",
    isCustom: false,
    avatarUrl: null
  },
  {
    id: "mindmate-default-2",
    name: "Code Mentor",
    tone: "Technical & Direct",
    colorTheme: "#10b981",
    systemPrompt: "You are a senior software engineering mentor. Provide clean, well-documented, correct code solutions.",
    isCustom: false,
    avatarUrl: null
  },
  {
    id: "mindmate-default-3",
    name: "Aria",
    tone: "Empathetic & Caring",
    colorTheme: "#8b5cf6",
    systemPrompt: "You are Aria, an empathetic, understanding listener. Offer warm, supportive responses.",
    isCustom: false,
    avatarUrl: null
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

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Seed default personas first
    await seedDefaultPersonas();

    // Fetch custom personas created by the user + default ones
    const dbPersonas = await prisma.persona.findMany({
      where: {
        OR: [
          { isCustom: false },
          { userId: user.userId }
        ]
      },
      orderBy: { name: "asc" }
    });

    // Put Clarity first
    dbPersonas.sort((a, b) => {
      if (a.name === "Clarity") return -1;
      if (b.name === "Clarity") return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ personas: dbPersonas });

  } catch (error) {
    console.error("[Get Personas Error]", error);
    return NextResponse.json({ error: "Failed to load personas" }, { status: 500 });
  }
}
