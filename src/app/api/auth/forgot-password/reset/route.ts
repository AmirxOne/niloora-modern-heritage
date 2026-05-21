import { hash } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { badRequest, ok, notFound, unauthorized, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { consumeResetToken } from "@/lib/server/auth/password-reset";

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
      return badRequest("Invalid reset payload");
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return notFound("phone_not_found");

    const tokenValid = await consumeResetToken(user.id, token);
    if (!tokenValid) return unauthorized("invalid_reset");

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
