import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

// Always attach to globalThis to prevent multiple connection pool creations in Serverless / Vercel
globalForPrisma.prisma = prisma;

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

// Ensure columns on server startup
ensureUserProfileColumns().catch(() => {});
