import { checkRateLimitSafe, createRateLimitKey } from "@/lib/server/rate-limit";

type RateLimitFail = { allowed: false; retryAfterSec: number };
type RateLimitOk = { allowed: true };

function firstBlocked(checks: Array<RateLimitOk | RateLimitFail>): RateLimitFail | null {
  for (const result of checks) {
    if (!result.allowed) return result;
  }
  return null;
}

export async function assertOtpRequestRateLimit(
  request: Request,
  phone: string
): Promise<RateLimitOk | RateLimitFail> {
  const ip = createRateLimitKey("auth:otp:request:ip", request);
  const phoneBurst = createRateLimitKey("auth:otp:request:phone:burst", request, phone);
  const phoneHour = createRateLimitKey("auth:otp:request:phone:hour", request, phone);
  const phoneDay = createRateLimitKey("auth:otp:request:phone:day", request, phone);

  const blocked = firstBlocked([
    await checkRateLimitSafe(ip, 20, 15 * 60_000),
    await checkRateLimitSafe(phoneBurst, 3, 10 * 60_000),
    await checkRateLimitSafe(phoneHour, 8, 60 * 60_000),
    await checkRateLimitSafe(phoneDay, 15, 24 * 60 * 60_000),
  ]);

  if (blocked) return blocked;
  return { allowed: true };
}

export async function assertOtpVerifyRateLimit(
  request: Request,
  phone: string
): Promise<RateLimitOk | RateLimitFail> {
  const ip = createRateLimitKey("auth:otp:verify:ip", request);
  const phoneBurst = createRateLimitKey("auth:otp:verify:phone:burst", request, phone);
  const phoneHour = createRateLimitKey("auth:otp:verify:phone:hour", request, phone);

  const blocked = firstBlocked([
    await checkRateLimitSafe(ip, 30, 15 * 60_000),
    await checkRateLimitSafe(phoneBurst, 10, 10 * 60_000),
    await checkRateLimitSafe(phoneHour, 25, 60 * 60_000),
  ]);

  if (blocked) return blocked;
  return { allowed: true };
}
