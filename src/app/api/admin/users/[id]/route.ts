import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";

type Body = {
  role?: string;
};

/**
 * Admin updates a user's role (user ⇄ admin).
 * Guards: the acting admin cannot demote themselves (lockout protection).
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await readSessionUser();
    const denied = ensureAdmin(admin);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as Body;

    if (body.role !== "user" && body.role !== "admin") {
      return badRequest("نقش معتبر نیست.");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("کاربر یافت نشد.");

    if (admin!.id === id && body.role === "user" && target.role === "admin") {
      return badRequest("نمی‌توانید نقش مدیریتی خودتان را حذف کنید.");
    }

    if (target.role === body.role) {
      return badRequest("کاربر هم‌اکنون این نقش را دارد.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, role: true },
    });

    serverLogger.info("user role changed by admin", {
      targetUserId: id,
      newRole: body.role,
      adminId: admin!.id,
    });

    return ok({ user: updated });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/users/[id]" });
  }
}
