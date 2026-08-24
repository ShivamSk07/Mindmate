import { prisma } from "@/lib/db";

/**
 * Auto-cleanup utility to delete documents & chunks older than 2 minutes
 * Keeps DB size minimal and saves database storage automatically.
 */
let lastCleanupTime = 0;
const CLEANUP_INTERVAL_MS = 60 * 1000; // Run at most once per minute
const DOCUMENT_TTL_MS = 2 * 60 * 1000; // 2 minutes TTL

export async function runAutoCleanupIfNeeded(): Promise<number> {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) {
    return 0; // Throttle cleanup to once every minute
  }

  lastCleanupTime = now;
  try {
    const expiredCutoff = new Date(now - DOCUMENT_TTL_MS);

    // Delete documents created older than 2 minutes ago
    // Prisma cascading delete will also delete corresponding DocumentChunks automatically
    const deleteResult = await prisma.document.deleteMany({
      where: {
        createdAt: {
          lt: expiredCutoff,
        },
      },
    });

    if (deleteResult.count > 0) {
      console.log(`[Auto-Cleanup]: Successfully purged ${deleteResult.count} expired document(s) older than 2 minutes.`);
    }

    return deleteResult.count;
  } catch (error) {
    console.warn("[Auto-Cleanup Warning]:", error);
    return 0;
  }
}
