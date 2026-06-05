export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminPromoBody } from "@/lib/server/promo/admin-promo-parse";
import { toAdminPromoRecord } from "@/lib/server/promo/promo-code";
import {
  deletePromoCode,
  updatePromoCode,
} from "@/lib/server/promo/promo-code-service";
import { prisma } from "@/lib/server/prisma";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return notFound("کد تخفیف یافت نشد.");

    const parsed = parseAdminPromoBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await updatePromoCode(id, parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.promo.update",
        route: "/api/admin/promo-codes/[id]",
        entityType: "promo_code",
        entityId: id,
        summary: `update promo ${row.code}`,
        payload: { id, code: row.code, type: row.type, value: row.value, active: row.active },
      });
      return ok({ promoCode: toAdminPromoRecord(row) });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return conflict("کدی با این شناسهٔ انگلیسی وجود دارد.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/promo-codes/[id]" });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) return notFound("کد تخفیف یافت نشد.");

    await deletePromoCode(id);
    await writeAdminAuditLog({
      user,
      request: _request,
      action: "admin.promo.delete",
      route: "/api/admin/promo-codes/[id]",
      entityType: "promo_code",
      entityId: id,
      summary: `delete promo ${existing.code}`,
      payload: { id, code: existing.code },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/promo-codes/[id]" });
  }
}
