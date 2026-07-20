export { dynamic } from "@/lib/server/route-segment";

import { hash } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, notFound, tooManyRequests, unauthorized, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { consumeResetToken } from "@/lib/server/auth/password-reset";
import { assertPasswordResetRateLimit } from "@/lib/server/auth/login-rate-limit";

type Body = {
  phone?: string;
  token?: string;
  newPassword?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    const token = body.token?.trim().toUpperCase() ?? "";
    const newPassword = body.newPassword ?? "";

    if (!phone || !token || newPassword.length < 6) {
      return badRequest("شماره موبایل، کد بازیابی و گذرواژه جدید معتبر الزامی است.", "invalid_reset_payload");
    }

    const rate = await assertPasswordResetRateLimit(request, phone);
    if (!rate.allowed) {
      return tooManyRequests(
        "تلاش‌های بازیابی بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
        rate.retryAfterSec,
        "reset_rate_limited"
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return notFound("کاربری با این شماره موبایل یافت نشد.");

    const tokenValid = await consumeResetToken(user.id, token);
    if (!tokenValid) return unauthorized("کد بازیابی نامعتبر یا منقضی است.", "invalid_reset");

    const passwordHash = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/forgot-password/reset" });
  }
}
