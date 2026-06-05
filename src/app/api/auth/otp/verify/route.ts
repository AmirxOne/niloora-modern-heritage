export { dynamic } from "@/lib/server/route-segment";

import { randomUUID } from "node:crypto";
import { getOtpApiMessage } from "@/lib/auth/otp-api-messages";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { assertOtpVerifyRateLimit } from "@/lib/server/auth/otp-rate-limit";
import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { badRequest, forbidden, unauthorized, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { verifyAndConsumeOtpCode } from "@/lib/server/auth/otp";
import { applySessionCookieToResponse, createSession } from "@/lib/server/auth/session";
import {
  applyReferralForUser,
  buildReferralCode,
  hashIp,
  readRequestIp,
} from "@/lib/server/referral/referral";
import { queueWelcomeJourney } from "@/lib/server/notifications/journey-notify";
import {
  createOtpAuthUser,
  findOtpAuthUserByPhone,
  type OtpAuthUser,
} from "@/lib/server/auth/otp-auth-user";

type Body = {
  phone?: string;
  code?: string;
  name?: string;
  referralCode?: string;
};

function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}

function buildDefaultName(phone: string): string {
  return phone;
}

function toOtpSessionUser(user: OtpAuthUser) {
  const role =
    user.role === "admin" || user.role === "editor" || user.role === "reviewer"
      ? user.role
      : "user";
  const tier =
    user.tier === "gold" || user.tier === "platinum" || user.tier === "royal" ? user.tier : "royal";
  return {
    id: user.id,
    name: user.phone,
    phone: user.phone,
    referralCode: user.referralCode,
    referralCredit: user.referralCredit ?? 0,
    referralEarnedTotal: user.referralEarnedTotal ?? 0,
    loyaltyPoints: 0,
    loyaltyTier: "bronze" as const,
    loyaltyLifetimeSpend: 0,
    favoriteStone: null,
    favoriteStyle: null,
    favoriteBudgetBand: null,
    role,
    memberSince: user.memberSince.toISOString(),
    tier,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    const code = (body.code ?? "").trim();
    const name = (body.name ?? "").trim();
    const referralCode = (body.referralCode ?? "").trim();

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

    const existingUser = await findOtpAuthUserByPhone(phone);
    const isNewUser = !existingUser;

    if (existingUser && referralCode) {
      const inviteIpHash = hashIp(readRequestIp(request));
      await prisma.$transaction(async (tx) => {
        await applyReferralForUser({
          tx,
          inviteeId: existingUser.id,
          referralCode,
          inviteIpHash,
        });
      });
    }

    const signupIpHash = hashIp(readRequestIp(request));
    if (existingUser?.blocked) {
      return forbidden("حساب کاربری شما مسدود شده است.", "account_blocked");
    }

    const user =
      existingUser ??
      (await prisma.$transaction(async (tx) => {
        const createdUser = await createOtpAuthUser(
          {
            name: buildDefaultName(phone),
            phone,
            role: "user",
            passwordHash: `OTP_ONLY_${randomUUID()}`,
            referralCode: buildReferralCode(),
            signupIpHash,
          },
          tx
        );
        if (referralCode) {
          await applyReferralForUser({
            tx,
            inviteeId: createdUser.id,
            referralCode,
            inviteIpHash: signupIpHash,
          });
        }
        return createdUser;
      }));

    const sessionToken = await createSession(user.id);
    if (isNewUser) {
      queueWelcomeJourney(user);
    }

    const response = NextResponse.json({
      user: toOtpSessionUser(user),
      isNewUser,
    });
    return applySessionCookieToResponse(response, sessionToken);
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/otp/verify" });
  }
}
