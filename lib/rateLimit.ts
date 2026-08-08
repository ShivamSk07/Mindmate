import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter
 * @param request NextRequest
 * @param limit Max allowed requests within window
 * @param windowMs Window duration in milliseconds (default 1 minute)
 * @returns boolean true if allowed, false if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number } {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const route = request.nextUrl.pathname;
  const key = `${ip}:${route}`;

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}
