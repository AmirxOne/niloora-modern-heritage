import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getOtpApiMessage } from "@/lib/auth/otp-api-messages";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { assertOtpVerifyRateLimit } from "@/lib/server/auth/otp-rate-limit";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, unauthorized, serverError, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { verifyAndConsumeOtpCode } from "@/lib/server/auth/otp";
import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import {
  applyReferralForUser,
  buildReferralCode,
  hashIp,
  readRequestIp,
} from "@/lib/server/referral/referral";
import { queueWelcomeJourney } from "@/lib/server/notifications/journey-notify";

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

const otpAuthUserSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  referralCode: true,
  referralCredit: true,
  referralEarnedTotal: true,
  role: true,
  memberSince: true,
  tier: true,
} satisfies Prisma.UserSelect;

type OtpAuthUser = Prisma.UserGetPayload<{ select: typeof otpAuthUserSelect }>;

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

    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: otpAuthUserSelect,
    });
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
    const user =
      existingUser ??
      (await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: buildDefaultName(phone),
            phone,
            role: "user",
            passwordHash: `OTP_ONLY_${randomUUID()}`,
            referralCode: buildReferralCode(),
            signupIpHash,
          },
          select: otpAuthUserSelect,
        });
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
    await setSessionCookie(sessionToken);
    if (isNewUser) {
      queueWelcomeJourney(user);
    }

    return ok({
      user: toOtpSessionUser(user),
      isNewUser,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/otp/verify" });
  }
}
