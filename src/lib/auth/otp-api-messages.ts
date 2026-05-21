import { toPersianDigits } from "@/lib/persian-digits";
import { fa } from "@/lib/i18n/fa";

export type OtpApiErrorCode =
  | "invalid_phone"
  | "otp_rate_limited"
  | "sms_send_failed"
  | "sms_not_configured"
  | "invalid_otp_payload"
  | "otp_expired"
  | "otp_too_many_attempts"
  | "otp_invalid";

export function getOtpApiMessage(code: OtpApiErrorCode, retryAfterSec?: number): string {
  switch (code) {
    case "invalid_phone":
      return fa.auth.validation.phoneInvalid;
    case "otp_rate_limited":
      return retryAfterSec != null && retryAfterSec > 0
        ? fa.auth.otpRateLimitedRetry(toPersianDigits(String(retryAfterSec)))
        : fa.auth.otpRateLimited;
    case "sms_send_failed":
      return fa.auth.otpSmsFailed;
    case "sms_not_configured":
      return fa.auth.otpSmsNotConfigured;
    case "invalid_otp_payload":
      return fa.auth.otpInvalid;
    case "otp_expired":
      return fa.auth.otpExpired;
    case "otp_too_many_attempts":
      return fa.auth.otpTooManyAttempts;
    case "otp_invalid":
      return fa.auth.otpInvalid;
    default:
      return fa.auth.otpSmsFailed;
  }
}
