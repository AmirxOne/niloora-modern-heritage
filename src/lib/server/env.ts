const requiredKeys = ["SESSION_SECRET"] as const;

type RequiredKey = (typeof requiredKeys)[number];

function readRequired(key: RequiredKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function readNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const serverEnv = {
  // PURPOSE: single typed source of server env defaults/requirements.
  sessionSecret: readRequired("SESSION_SECRET"),
  // Refresh credential lifetime (access token is fixed to 1 day in auth/session).
  sessionMaxAgeDays: readNumber("SESSION_MAX_AGE_DAYS", 30),
  resetTokenTtlMinutes: readNumber("RESET_TOKEN_TTL_MINUTES", 30),
  otpTtlMinutes: readNumber("OTP_TTL_MINUTES", 3),
  telegramChannel: process.env.TELEGRAM_CHANNEL ?? "galleryhannan",
  zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID?.trim() ?? "",
  zarinpalSandbox: process.env.ZARINPAL_SANDBOX !== "false",
  smsProvider: (process.env.SMS_PROVIDER ?? "kavenegar").trim().toLowerCase(),
  kavenegarApiKey: process.env.KAVENEGAR_API_KEY?.trim() ?? "",
  kavenegarOtpTemplate: process.env.KAVENEGAR_OTP_TEMPLATE?.trim() ?? "verify",
  kavenegarSender: process.env.KAVENEGAR_SENDER?.trim() ?? "",
  kavenegarTemplateOrderPlaced: process.env.KAVENEGAR_TEMPLATE_ORDER_PLACED?.trim() ?? "",
  kavenegarTemplateOrderShipped: process.env.KAVENEGAR_TEMPLATE_ORDER_SHIPPED?.trim() ?? "",
  notifyEnabled: process.env.NOTIFY_ENABLED !== "false",
  resendApiKey: process.env.RESEND_API_KEY?.trim() ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL?.trim() ?? "",
  notifyEmailEnabled: process.env.NOTIFY_EMAIL_ENABLED === "true",
  abandonedCartEnabled: process.env.ABANDONED_CART_ENABLED !== "false",
  abandonedCartReminderDelayMinutes: readNumber("ABANDONED_CART_REMINDER_DELAY_MINUTES", 120),
  abandonedCartCronSecret: process.env.ABANDONED_CART_CRON_SECRET?.trim() ?? "",
};
