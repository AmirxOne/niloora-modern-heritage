import { checkRateLimitSafe, createRateLimitKey } from "@/lib/server/rate-limit";
import { isOtpDevPreviewMode } from "@/lib/server/sms/send-otp";

type RateLimitFail = { allowed: false; retryAfterSec: number };
type RateLimitOk = { allowed: true };

/**
 * شماره‌های تست E2E (0912000xxxx). فقط در dev (OTP preview فعال) از rate limit
 * OTP معاف‌اند تا suiteهای Playwright با loginهای مکرر fail نشوند.
 * در production هیچ‌وقت معافیت اعمال نمی‌شود.
 */
function isE2eTestPhone(phone: string): boolean {
  if (!isOtpDevPreviewMode()) return false;
  return /^0912000\d{4}$/.test(phone);
}

/**
 * در dev-preview خودِ کد OTP در response بازگردانده می‌شود؛ rate limit این
 * مسیر در dev بار امنیتی ندارد و فقط اجرای suiteهای تست را می‌شکند
 * (IP لوکال همه «unknown» است و bucket مشترک ۲۰تایی پر می‌شود).
 * در production کامل اعمال می‌شود.
 */
function shouldSkipOtpRateLimit(): boolean {
  return isOtpDevPreviewMode();
}

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
  if (isE2eTestPhone(phone) || shouldSkipOtpRateLimit()) return { allowed: true };
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
  if (isE2eTestPhone(phone) || shouldSkipOtpRateLimit()) return { allowed: true };
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
