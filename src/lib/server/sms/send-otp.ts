import { fa } from "@/lib/i18n/fa";
import { serverEnv } from "@/lib/server/env";
import { isSmsServiceAvailable } from "@/lib/server/site-settings/effective-services";
import { sendKavenegarOtpLookup, sendKavenegarPlainSms } from "@/lib/server/sms/kavenegar";

export function isOtpDevPreviewMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function isSmsConfiguredForProduction(): Promise<boolean> {
  return isSmsServiceAvailable();
}

export async function deliverOtpSms(phone: string, code: string): Promise<void> {
  if (serverEnv.smsProvider === "kavenegar") {
    const lookup = await sendKavenegarOtpLookup(phone, code);
    if (lookup.ok) return;

    if (lookup.reason === "not_configured") {
      throw new OtpSmsError("sms_not_configured");
    }

    if (serverEnv.kavenegarSender) {
      const text = fa.auth.otpSmsBody(code);
      const plain = await sendKavenegarPlainSms(phone, text);
      if (plain.ok) return;
      if (plain.reason === "not_configured") {
        throw new OtpSmsError("sms_not_configured");
      }
    }

    console.error("[sms] Kavenegar OTP failed:", lookup.detail);
    throw new OtpSmsError("sms_send_failed");
  }

  throw new OtpSmsError("sms_not_configured");
}

export class OtpSmsError extends Error {
  readonly code: "sms_send_failed" | "sms_not_configured";

  constructor(code: "sms_send_failed" | "sms_not_configured") {
    super(code);
    this.name = "OtpSmsError";
    this.code = code;
  }
}
