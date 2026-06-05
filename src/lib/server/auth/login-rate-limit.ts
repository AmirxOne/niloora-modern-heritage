import { checkRateLimit, createRateLimitKey } from "@/lib/server/rate-limit";

type RateLimitFail = { allowed: false; retryAfterSec: number };
type RateLimitOk = { allowed: true };

export function assertPasswordResetRateLimit(
  request: Request,
  phone: string
): RateLimitOk | RateLimitFail {
  const ip = createRateLimitKey("auth:reset:verify:ip", request);
  const phoneKey = createRateLimitKey("auth:reset:verify:phone", request, phone);

  for (const result of [
    checkRateLimit(ip, 20, 15 * 60_000),
    checkRateLimit(phoneKey, 8, 15 * 60_000),
  ]) {
    if (!result.allowed) return result;
  }

  return { allowed: true };
}

export function assertPasswordLoginRateLimit(
  request: Request,
  phone: string
): RateLimitOk | RateLimitFail {
  const ip = createRateLimitKey("auth:login:ip", request);
  const phoneKey = createRateLimitKey("auth:login:phone", request, phone);

  for (const result of [
    checkRateLimit(ip, 30, 15 * 60_000),
    checkRateLimit(phoneKey, 10, 15 * 60_000),
  ]) {
    if (!result.allowed) return result;
  }

  return { allowed: true };
}
