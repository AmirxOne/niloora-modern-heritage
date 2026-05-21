import { fa } from "@/lib/i18n/fa";

export type AuthErrorCode =
  | "invalid_credentials"
  | "phone_exists"
  | "phone_not_found"
  | "invalid_reset"
  | "otp_invalid"
  | "otp_expired"
  | "otp_too_many_attempts"
  | "otp_rate_limited"
  | "sms_send_failed"
  | "invalid_phone"
  | "unauthorized"
  | "unknown"
  | null;

export function getAuthErrorMessage(error: AuthErrorCode): string | null {
  switch (error) {
    case "invalid_credentials":
      return fa.auth.invalidCredentials;
    case "phone_exists":
      return fa.auth.phoneExists;
    case "phone_not_found":
      return fa.auth.forgotPhoneNotFound;
    case "invalid_reset":
      return fa.auth.resetInvalid;
    case "otp_invalid":
      return fa.auth.otpInvalid;
    case "otp_expired":
      return fa.auth.otpExpired;
    case "otp_too_many_attempts":
      return fa.auth.otpTooManyAttempts;
    case "otp_rate_limited":
      return fa.auth.otpRateLimited;
    case "sms_send_failed":
      return fa.auth.otpSmsFailed;
    case "invalid_phone":
      return fa.auth.validation.phoneInvalid;
    default:
      return null;
  }
}
