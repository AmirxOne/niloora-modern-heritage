export { dynamic } from "@/lib/server/route-segment";

import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, notFound, serverError, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { createResetToken } from "@/lib/server/auth/password-reset";
import { checkRateLimitSafe, createRateLimitKey } from "@/lib/server/rate-limit";

type Body = {
  phone?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    if (!phone) return badRequest("شماره موبایل معتبر نیست.", "invalid_phone");

    const rate = await checkRateLimitSafe(
      createRateLimitKey("auth:reset:request", request, phone),
      5,
      60_000
    );
    if (!rate.allowed) {
      return tooManyRequests(
        "درخواست بازیابی بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
        rate.retryAfterSec,
        "reset_rate_limited"
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return notFound("کاربری با این شماره موبایل یافت نشد.");

    const tokenPreview = await createResetToken(user.id);
    return ok(
      process.env.NODE_ENV === "production"
        ? { sent: true }
        : { sent: true, tokenPreview }
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/forgot-password/request" });
  }
}
