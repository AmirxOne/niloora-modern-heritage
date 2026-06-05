export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminPromoBody } from "@/lib/server/promo/admin-promo-parse";
import { toAdminPromoRecord } from "@/lib/server/promo/promo-code";
import {
  createPromoCode,
  listAdminPromoCodes,
} from "@/lib/server/promo/promo-code-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const promoCodes = await listAdminPromoCodes();
    return ok({ promoCodes });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/promo-codes" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const parsed = parseAdminPromoBody(await request.json());
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const row = await createPromoCode(parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.promo.create",
        route: "/api/admin/promo-codes",
        entityType: "promo_code",
        entityId: row.id,
        summary: `create promo ${row.code}`,
        payload: { id: row.id, code: row.code, type: row.type, value: row.value },
      });
      return created({ promoCode: toAdminPromoRecord(row) });
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
    return handleRouteError(error, { route: "/api/admin/promo-codes" });
  }
}
