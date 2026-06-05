export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { isAdminUserRole } from "@/lib/server/users/admin-user";
import {
  adminUserDetailSelect,
  loadOrderTotalsByUserId,
  toAdminUserDetailDto,
} from "@/lib/server/users/admin-user-dto";

type Body = {
  role?: string;
  blocked?: boolean;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await readSessionUser();
    const denied = ensureAdmin(actor);
    if (denied) return denied;

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: adminUserDetailSelect,
    });
    if (!user) return notFound("کاربر یافت نشد.");

    const totals = await loadOrderTotalsByUserId([user.id]);
    return ok({ user: toAdminUserDetailDto(user, totals.get(user.id) ?? 0) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/users/[id]" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await readSessionUser();
    const denied = ensureAdmin(actor);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as Body;

    const hasRole = body.role !== undefined;
    const hasBlocked = body.blocked !== undefined;

    if (!hasRole && !hasBlocked) {
      return badRequest("نقش یا وضعیت مسدودسازی را ارسال کنید.");
    }

    if (hasRole && (!body.role || !isAdminUserRole(body.role))) {
      return badRequest("نقش مجاز: user، editor، reviewer، admin");
    }

    if (actor?.id === id) {
      if (hasRole && body.role !== "admin") {
        return badRequest("نمی‌توانید نقش خود را تغییر دهید.");
      }
      if (hasBlocked && body.blocked) {
        return badRequest("نمی‌توانید حساب خود را مسدود کنید.");
      }
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, blocked: true },
    });
    if (!existing) return notFound("کاربر یافت نشد.");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(hasRole ? { role: body.role } : {}),
        ...(hasBlocked ? { blocked: Boolean(body.blocked) } : {}),
      },
      select: adminUserDetailSelect,
    });

    if (hasBlocked && body.blocked) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    await writeAdminAuditLog({
      user: actor,
      request,
      action: "admin.users.update",
      route: "/api/admin/users/[id]",
      entityType: "user",
      entityId: id,
      summary: `update user ${id}`,
      payload: {
        id,
        previousRole: existing.role,
        nextRole: updated.role,
        previousBlocked: existing.blocked,
        nextBlocked: updated.blocked,
      },
    });

    const totals = await loadOrderTotalsByUserId([updated.id]);
    return ok({ user: toAdminUserDetailDto(updated, totals.get(updated.id) ?? 0) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/users/[id]" });
  }
}
