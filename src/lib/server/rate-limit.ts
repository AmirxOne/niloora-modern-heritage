import { prisma } from "@/lib/server/prisma";

const WINDOW_MS = 60_000;
const LIMIT = 15;

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function createRateLimitKey(scope: string, request: Request, extra?: string): string {
  // PURPOSE: deterministic key by scope + caller IP (+ optional user dimension).
  const ip = getClientIp(request);
  return `${scope}:${ip}:${extra ?? ""}`;
}

export function checkRateLimit(
  key: string,
  limit = LIMIT,
  windowMs = WINDOW_MS
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  // BOUNDARY: in-memory limiter (single runtime); suitable for dev/small deployments.
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true };
}

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSec: number };

function computeRateLimitResult(
  count: number,
  limit: number,
  resetAt: Date
): RateLimitResult {
  if (count <= limit) return { allowed: true };
  const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
  return { allowed: false, retryAfterSec };
}

async function checkRateLimitDistributed(
  key: string,
  limit = LIMIT,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  const db = prisma as unknown as {
    $queryRawUnsafe?: (
      query: string,
      ...params: unknown[]
    ) => Promise<Array<{ count: number; resetAt: Date }>>;
  };
  if (typeof db.$queryRawUnsafe !== "function") {
    return checkRateLimit(key, limit, windowMs);
  }

  const nextResetAt = new Date(Date.now() + windowMs);
  const rows = await db.$queryRawUnsafe(
    `
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
      VALUES ($1, 1, $2, NOW(), NOW())
      ON CONFLICT ("key")
      DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN $2
          ELSE "RateLimitBucket"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `,
    key,
    nextResetAt
  );

  const row = rows[0];
  if (!row) return { allowed: true };
  return computeRateLimitResult(Number(row.count), limit, new Date(row.resetAt));
}

export async function checkRateLimitSafe(
  key: string,
  limit = LIMIT,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_STORE === "memory") {
    return checkRateLimit(key, limit, windowMs);
  }
  try {
    return await checkRateLimitDistributed(key, limit, windowMs);
  } catch {
    return checkRateLimit(key, limit, windowMs);
  }
}
