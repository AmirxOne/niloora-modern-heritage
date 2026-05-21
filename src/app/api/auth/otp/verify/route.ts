import { randomUUID } from "node:crypto";
import { getOtpApiMessage } from "@/lib/auth/otp-api-messages";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { assertOtpVerifyRateLimit } from "@/lib/server/auth/otp-rate-limit";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, unauthorized, serverError, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { verifyAndConsumeOtpCode } from "@/lib/server/auth/otp";
import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";

type Body = {
  phone?: string;
  code?: string;
  name?: string;
};

function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}

function buildDefaultName(phone: string): string {
  return phone;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    const code = (body.code ?? "").trim();
    const name = (body.name ?? "").trim();

    if (!phone) {
      return badRequest(getOtpApiMessage("invalid_phone"), "invalid_phone");
    }
    if (!isValidOtp(code)) {
      return badRequest(getOtpApiMessage("invalid_otp_payload"), "invalid_otp_payload");
    }

    const rate = assertOtpVerifyRateLimit(request, phone);
    if (!rate.allowed) {
      return tooManyRequests(
        getOtpApiMessage("otp_rate_limited", rate.retryAfterSec),
        rate.retryAfterSec,
        "otp_rate_limited"
      );
    }

    const verifyResult = await verifyAndConsumeOtpCode(phone, code);
    if (verifyResult === "expired") {
      return unauthorized(getOtpApiMessage("otp_expired"), "otp_expired");
    }
    if (verifyResult === "too_many_attempts") {
      return unauthorized(getOtpApiMessage("otp_too_many_attempts"), "otp_too_many_attempts");
    }
    if (verifyResult !== "ok") {
      return unauthorized(getOtpApiMessage("otp_invalid"), "otp_invalid");
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !existingUser;

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          name: buildDefaultName(phone),
          phone,
          role: "user",
          passwordHash: `OTP_ONLY_${randomUUID()}`,
        },
      }));

    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return ok({
      user: toSessionUser(user),
      isNewUser,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/otp/verify" });
  }
}
