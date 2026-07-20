export { dynamic } from "@/lib/server/route-segment";

import { compare } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, forbidden, ok, tooManyRequests, unauthorized, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { applySessionCookieToResponse, createSession } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";
import { assertPasswordLoginRateLimit } from "@/lib/server/auth/login-rate-limit";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

type Body = {
  phone?: string;
  password?: string;
};

export async function POST(request: Request) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/auth/login",
    role: "user",
    journey: "auth",
    action: "password_login",
  });
  logCriticalStart(critical);
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    const password = body.password ?? "";
    if (!phone || !password) {
      logCriticalOutcome(critical, "blocked", { code: "invalid_login_payload" });
      return withCorrelationId(
        badRequest("شماره موبایل یا گذرواژه واردشده معتبر نیست.", "invalid_login_payload"),
        critical.correlationId
      );
    }

    const rate = await assertPasswordLoginRateLimit(request, phone);
    if (!rate.allowed) {
      logCriticalOutcome(critical, "blocked", {
        code: "login_rate_limited",
        retryAfterSec: rate.retryAfterSec ?? null,
      });
      return withCorrelationId(
        tooManyRequests(
          "تلاش‌های ورود بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.",
          rate.retryAfterSec,
          "login_rate_limited"
        ),
        critical.correlationId
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      logCriticalOutcome(critical, "blocked", { code: "invalid_credentials" });
      return withCorrelationId(
        unauthorized("شماره موبایل یا گذرواژه اشتباه است.", "invalid_credentials"),
        critical.correlationId
      );
    }

    if (user.blocked) {
      logCriticalOutcome(critical, "blocked", { code: "account_blocked", userId: user.id });
      return withCorrelationId(
        forbidden("حساب کاربری شما مسدود شده است.", "account_blocked"),
        critical.correlationId
      );
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      logCriticalOutcome(critical, "blocked", { code: "invalid_credentials", userId: user.id });
      return withCorrelationId(
        unauthorized("شماره موبایل یا گذرواژه اشتباه است.", "invalid_credentials"),
        critical.correlationId
      );
    }

    const sessionToken = await createSession(user.id);
    const response = ok({ user: toSessionUser(user) });
    logCriticalOutcome(critical, "success", { userId: user.id });
    return withCorrelationId(applySessionCookieToResponse(response, sessionToken), critical.correlationId);
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/auth/login",
      request,
      role: "user",
      journey: "auth",
      action: "password_login",
    });
  }
}
