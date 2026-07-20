export { dynamic } from "@/lib/server/route-segment";

import { hash } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { conflict, created, badRequest, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { applySessionCookieToResponse, createSession } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";
import { queueWelcomeJourney } from "@/lib/server/notifications/journey-notify";
import {
  applyReferralForUser,
  buildReferralCode,
  hashIp,
  readRequestIp,
} from "@/lib/server/referral/referral";

type Body = {
  name?: string;
  phone?: string;
  password?: string;
  referralCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const name = body.name?.trim() ?? "";
    const phone = normalizeIranPhone(body.phone ?? "");
    const password = body.password ?? "";
    const referralCode = body.referralCode?.trim() ?? "";

    if (!name || !phone || password.length < 6) {
      return badRequest("نام، شماره موبایل معتبر و گذرواژه حداقل ۶ کاراکتری الزامی است.", "invalid_registration_payload");
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return conflict("این شماره موبایل قبلاً ثبت شده است.");
    }

    const passwordHash = await hash(password, 10);
    const signupIpHash = hashIp(readRequestIp(request));
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          phone,
          role: "user",
          passwordHash,
          referralCode: buildReferralCode(),
          signupIpHash,
        },
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
    });

    const sessionToken = await createSession(user.id);
    queueWelcomeJourney(user);

    const response = created({ user: toSessionUser(user) });
    return applySessionCookieToResponse(response, sessionToken);
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/register" });
  }
}
