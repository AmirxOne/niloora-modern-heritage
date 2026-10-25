import { normalizeIranPhone } from "@/lib/auth/phone";
import { serverEnv } from "@/lib/server/env";
import { serverLogger } from "@/lib/observability/logger";
import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";

/**
 * DELIVERY CHANNEL for the password-reset token in production.
 * Uses Kavenegar plain SMS (service line) — no new template registration
 * required. In development the message is only logged (preview mode inside
 * deliverTransactionalSms).
 */
export async function deliverPasswordResetSms(input: {
  phone: string;
  token: string;
  ttlMinutes: number;
}): Promise<{ delivered: boolean }> {
  const phone = normalizeIranPhone(input.phone);
  if (!phone) return { delivered: false };

  const message =
    `کد بازیابی رمز عبور گالری نیلورا: ${input.token}\n` +
    `این کد تا ${input.ttlMinutes} دقیقه معتبر است و برای شما ارسال شده است.\n` +
    `اگر شما درخواست نکرده‌اید این پیام را نادیده بگیرید.`;

  if (process.env.NODE_ENV !== "production") {
    serverLogger.info("[reset:sms:preview]", { phone, token: input.token });
    return { delivered: true };
  }

  try {
    const result = await deliverTransactionalSms({ phone, message });
    if (!result.ok) {
      const reason = result.reason === "not_configured" ? "not_configured" : "provider_error";
      serverLogger.error("password reset sms failed", {
        reason,
        detail: result.detail ?? null,
      });
      return { delivered: false };
    }
    return { delivered: true };
  } catch (error) {
    serverLogger.error("password reset sms error", undefined, error);
    return { delivered: false };
  }
}

export function resetSmsTtlMinutes(): number {
  return serverEnv.resetTokenTtlMinutes;
}
