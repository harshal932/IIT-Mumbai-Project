/**
 * Rate limiter with in-memory fallback.
 *
 * Production: configure REDIS_URL to use a distributed limiter.
 * MVP: uses an in-memory Map — works only on a single process/server.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  limit: number;
  windowSecs: number;
  prefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `${options.prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = options.windowSecs * 1000;

  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;
  const remaining = Math.max(0, options.limit - entry.count);
  const allowed = entry.count <= options.limit;

  return { allowed, remaining, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export const RateLimits = {
  createProblem: { limit: 5, windowSecs: 3600, prefix: "rl:problem" },
  createComment: { limit: 20, windowSecs: 3600, prefix: "rl:comment" },
  verifyProblem: { limit: 10, windowSecs: 3600, prefix: "rl:verify" },
  helpOffer: { limit: 10, windowSecs: 3600, prefix: "rl:help" },
  createHelpOffer: { limit: 10, windowSecs: 3600, prefix: "rl:help" },
  register: { limit: 5, windowSecs: 3600, prefix: "rl:register" },
  report: { limit: 5, windowSecs: 3600, prefix: "rl:report" },
  createReport: { limit: 5, windowSecs: 3600, prefix: "rl:report" },
} as const;
