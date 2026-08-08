import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let columnsEnsured = false;
export async function ensureUserProfileColumns() {
  if (columnsEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "githubConnected" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "githubToken" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "githubUsername" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "githubAvatarUrl" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "googleConnected" BOOLEAN DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "googleEmail" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "mcpConnected" BOOLEAN DEFAULT false;`);
    columnsEnsured = true;
  } catch (e) {
    console.warn("ensureUserProfileColumns auto-migration notice:", e);
  }
}

// Ensure columns on server start
ensureUserProfileColumns().catch(() => {});

// Background reminders interval worker
const globalForReminders = globalThis as unknown as {
  reminderInterval: NodeJS.Timeout | undefined;
};

if (!globalForReminders.reminderInterval && process.env.NODE_ENV === "production") {
  globalForReminders.reminderInterval = setInterval(async () => {
    try {
      const now = new Date();
      const tasks = await prisma.scheduledTask.findMany({
        where: {
          runAt: { lte: now },
          isRun: false,
        },
      });

      for (const task of tasks) {
        await prisma.message.create({
          data: {
            role: "assistant",
            content: `🔔 **REMINDER**: ${task.details}`,
            sessionId: task.sessionId,
          },
        });

        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: { isRun: true },
        });
      }
    } catch (err) {
      // Silently catch background worker connection errors
    }
  }, 60000);
}
