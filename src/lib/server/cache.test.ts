import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * cache.ts is a thin Redis read-through. With no REDIS_URL in dev/test the
 * module degrades to a direct loader — that behavior is what we can unit
 * test without a live Redis. Invalidation correctness with a live instance
 * is covered by the E2E suite.
 */

describe("server cache (no-redis degradation)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cached() calls the loader directly without Redis", async () => {
    const { cached } = await import("./cache");
    const loader = vi.fn(async () => ({ value: 42 }));
    const result = await cached("test", "k1", loader);
    expect(result).toEqual({ value: 42 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("redis export is null when REDIS_URL is unset", async () => {
    const { redis } = await import("./cache");
    expect(redis).toBeNull();
  });
});
