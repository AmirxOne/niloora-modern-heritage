import { getOtpApiMessage } from "@/lib/auth/otp-api-messages";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { assertOtpRequestRateLimit } from "@/lib/server/auth/otp-rate-limit";
import { issueOtpCode, revokeLatestPendingOtp } from "@/lib/server/auth/otp";
import { prisma } from "@/lib/server/prisma";
import {
  badRequest,
  ok,
  serverError,
  serviceUnavailable,
  tooManyRequests,
} from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  deliverOtpSms,
  isOtpDevPreviewMode,
  isSmsConfiguredForProduction,
  OtpSmsError,
} from "@/lib/server/sms/send-otp";

type Body = {
  phone?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    if (!phone) {
      return badRequest(getOtpApiMessage("invalid_phone"), "invalid_phone");
    }

    const rate = assertOtpRequestRateLimit(request, phone);
    if (!rate.allowed) {
      return tooManyRequests(
        getOtpApiMessage("otp_rate_limited", rate.retryAfterSec),
        rate.retryAfterSec,
        "otp_rate_limited"
      );
    }

    const isDev = isOtpDevPreviewMode();
    if (!isDev && !(await isSmsConfiguredForProduction())) {
      console.error("[otp] SMS not configured for production");
      return serviceUnavailable(getOtpApiMessage("sms_not_configured"), "sms_not_configured");
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    const { code, expiresAt } = await issueOtpCode(phone);

    if (!isDev) {
      try {
        await deliverOtpSms(phone, code);
      } catch (error) {
        await revokeLatestPendingOtp(phone);
        if (error instanceof OtpSmsError) {
          const msg = getOtpApiMessage(error.code);
          if (error.code === "sms_not_configured") {
            return serviceUnavailable(msg, error.code);
          }
          return badRequest(msg, error.code);
        }
        console.error(error);
        return badRequest(getOtpApiMessage("sms_send_failed"), "sms_send_failed");
      }
    }

    const payload: {
      phone: string;
      isNewUser: boolean;
      expiresAt: string;
      otpPreview?: string;
    } = {
      phone,
      isNewUser: !existingUser,
      expiresAt: expiresAt.toISOString(),
    };

    if (isDev) {
      payload.otpPreview = code;
    }

    return ok(payload);
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/otp/request" });
  }
}
