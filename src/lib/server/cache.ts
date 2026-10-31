import Redis from "ioredis";

/**
 * Server-side cache (Redis) for hot read paths: catalog, search index.
 * Single shared connection per process; failures degrade to NO cache
 * (never crash a request because Redis is down).
 *
 * Invalidation: publish on the `niloora:cache:invalidate` channel OR
 * bump the version key — readers compose keys as `${name}:v${version}`,
 * so a version bump atomically invalidates every derived cache entry.
 */

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

const globalForRedis = globalThis as unknown as { __nilooraRedis?: Redis };

export const redis: Redis | null =
  process.env.NODE_ENV === "production" && process.env.REDIS_URL
    ? globalForRedis.__nilooraRedis ?? new Redis(REDIS_URL, {
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      })
    : null;

if (redis && !globalForRedis.__nilooraRedis) globalForRedis.__nilooraRedis = redis;

const VERSION_KEY = "niloora:cache:version:catalog";
const DEFAULT_TTL_SEC = 120;

async function currentVersion(name: string): Promise<string> {
  if (!redis) return "0";
  try {
    const v = await redis.get(`${VERSION_KEY}:${name}`);
    return v ?? "1";
  } catch {
    return "1";
  }
}

/** Bump the version — every cached entry under this name becomes unreachable. */
export async function invalidateCache(name: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.incr(`${VERSION_KEY}:${name}`);
  } catch {
    /* cache is best-effort */
  }
}

/**
 * Cached read-through helper.
 * - production: Redis with TTL (default 120s) + version-based invalidation
 * - dev/no-redis: calls the loader directly (zero overhead)
 */
export async function cached<T>(
  name: string,
  key: string,
  loader: () => Promise<T>,
  ttlSec: number = DEFAULT_TTL_SEC
): Promise<T> {
  if (!redis) return loader();

  const version = await currentVersion(name);
  const fullKey = `niloora:${name}:v${version}:${key}`;
  try {
    const raw = await redis.get(fullKey);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch {
    return loader(); // redis down → serve fresh
  }

  const value = await loader();
  try {
    await redis.set(fullKey, JSON.stringify(value), "EX", ttlSec);
  } catch {
    /* best-effort write */
  }
  return value;
}
