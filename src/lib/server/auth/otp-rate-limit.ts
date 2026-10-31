import { checkRateLimit, createRateLimitKey } from "@/lib/server/rate-limit";

type RateLimitFail = { allowed: false; retryAfterSec: number };
type RateLimitOk = { allowed: true };

function firstBlocked(
  checks: Array<RateLimitOk | RateLimitFail>
): RateLimitFail | null {
  for (const result of checks) {
    if (!result.allowed) return result;
  }
  return null;
}

export function assertOtpRequestRateLimit(
  request: Request,
  phone: string
): RateLimitOk | RateLimitFail {
  // E2E (production build): specs legitimately log the same seeded phones
  // in repeatedly within minutes — the burst limit would 429 them.
  // The isolated test env opts out explicitly; production is unaffected.
  if (process.env.E2E_OTP_PREVIEW === "1") return { allowed: true };
  const ip = createRateLimitKey("auth:otp:request:ip", request);
  const phoneBurst = createRateLimitKey("auth:otp:request:phone:burst", request, phone);
  const phoneHour = createRateLimitKey("auth:otp:request:phone:hour", request, phone);
  const phoneDay = createRateLimitKey("auth:otp:request:phone:day", request, phone);

  const blocked = firstBlocked([
    checkRateLimit(ip, 20, 15 * 60_000),
    checkRateLimit(phoneBurst, 3, 10 * 60_000),
    checkRateLimit(phoneHour, 8, 60 * 60_000),
    checkRateLimit(phoneDay, 15, 24 * 60 * 60_000),
  ]);

  if (blocked) return blocked;
  return { allowed: true };
}

export function assertOtpVerifyRateLimit(
  request: Request,
  phone: string
): RateLimitOk | RateLimitFail {
  if (process.env.E2E_OTP_PREVIEW === "1") return { allowed: true };
  const ip = createRateLimitKey("auth:otp:verify:ip", request);
  const phoneBurst = createRateLimitKey("auth:otp:verify:phone:burst", request, phone);
  const phoneHour = createRateLimitKey("auth:otp:verify:phone:hour", request, phone);

  const blocked = firstBlocked([
    checkRateLimit(ip, 30, 15 * 60_000),
    checkRateLimit(phoneBurst, 10, 10 * 60_000),
    checkRateLimit(phoneHour, 25, 60 * 60_000),
  ]);

  if (blocked) return blocked;
  return { allowed: true };
}
