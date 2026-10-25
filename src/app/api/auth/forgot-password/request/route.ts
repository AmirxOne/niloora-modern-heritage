import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, notFound, serverError, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { createResetToken } from "@/lib/server/auth/password-reset";
import { deliverPasswordResetSms } from "@/lib/server/auth/password-reset-sms";
import { serverEnv } from "@/lib/server/env";
import { checkRateLimit, createRateLimitKey } from "@/lib/server/rate-limit";

type Body = {
  phone?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    if (!phone) return badRequest("Invalid phone");

    const rate = checkRateLimit(createRateLimitKey("auth:reset:request", request, phone), 5, 60_000);
    if (!rate.allowed) {
      return tooManyRequests("reset_rate_limited", rate.retryAfterSec);
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return notFound("phone_not_found");

    const tokenPreview = await createResetToken(user.id);

    // Production must actually deliver the token — otherwise reset is unusable.
    if (process.env.NODE_ENV === "production") {
      const delivery = await deliverPasswordResetSms({
        phone,
        token: tokenPreview,
        ttlMinutes: serverEnv.resetTokenTtlMinutes,
      });
      if (!delivery.delivered) {
        return serverError("reset_sms_failed");
      }
      return ok({ sent: true });
    }

    return ok({ sent: true, tokenPreview });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/forgot-password/request" });
  }
}
