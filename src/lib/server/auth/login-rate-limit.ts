import { checkRateLimitSafe, createRateLimitKey } from "@/lib/server/rate-limit";

type RateLimitFail = { allowed: false; retryAfterSec: number };
type RateLimitOk = { allowed: true };

export async function assertPasswordResetRateLimit(
  request: Request,
  phone: string
): Promise<RateLimitOk | RateLimitFail> {
  const ip = createRateLimitKey("auth:reset:verify:ip", request);
  const phoneKey = createRateLimitKey("auth:reset:verify:phone", request, phone);

  for (const result of [
    await checkRateLimitSafe(ip, 20, 15 * 60_000),
    await checkRateLimitSafe(phoneKey, 8, 15 * 60_000),
  ]) {
    if (!result.allowed) return result;
  }

  return { allowed: true };
}

export async function assertPasswordLoginRateLimit(
  request: Request,
  phone: string
): Promise<RateLimitOk | RateLimitFail> {
  const ip = createRateLimitKey("auth:login:ip", request);
  const phoneKey = createRateLimitKey("auth:login:phone", request, phone);

  for (const result of [
    await checkRateLimitSafe(ip, 30, 15 * 60_000),
    await checkRateLimitSafe(phoneKey, 10, 15 * 60_000),
  ]) {
    if (!result.allowed) return result;
  }

  return { allowed: true };
}
