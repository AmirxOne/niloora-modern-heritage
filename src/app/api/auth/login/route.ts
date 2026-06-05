export { dynamic } from "@/lib/server/route-segment";

import { compare } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, forbidden, ok, tooManyRequests, unauthorized, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { applySessionCookieToResponse, createSession } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";
import { assertPasswordLoginRateLimit } from "@/lib/server/auth/login-rate-limit";

type Body = {
  phone?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const phone = normalizeIranPhone(body.phone ?? "");
    const password = body.password ?? "";
    if (!phone || !password) {
      return badRequest("Invalid login payload");
    }

    const rate = assertPasswordLoginRateLimit(request, phone);
    if (!rate.allowed) {
      return tooManyRequests("login_rate_limited", rate.retryAfterSec);
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return unauthorized("invalid_credentials");

    if (user.blocked) {
      return forbidden("حساب کاربری شما مسدود شده است.", "account_blocked");
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) return unauthorized("invalid_credentials");

    const sessionToken = await createSession(user.id);
    const response = ok({ user: toSessionUser(user) });
    return applySessionCookieToResponse(response, sessionToken);
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/login" });
  }
}
