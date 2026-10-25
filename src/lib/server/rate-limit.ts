const WINDOW_MS = 60_000;
const LIMIT = 15;

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweepExpired(now: number): void {
  // BOUNDARY: keep the in-memory map bounded — drop expired buckets so
  // spoofed-IP floods cannot grow it without limit.
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, bucket] of Array.from(store)) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

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
  sweepExpired(now);
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
