export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { approveVendor, rejectVendor } from "@/lib/server/vendor/vendor-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as { action?: "approve" | "reject"; reason?: string };

    if (body.action === "reject") {
      if (!body.reason?.trim()) return badRequest("دلیل رد الزامی است.");
      const vendor = await rejectVendor(id, body.reason);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.vendors.reject",
        route: "/api/admin/vendors/[id]",
        entityType: "vendor",
        entityId: id,
        summary: `reject vendor ${id}`,
      });
      return ok({ vendor });
    }

    if (body.action === "approve" || !body.action) {
      const vendor = await approveVendor(id);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.vendors.approve",
        route: "/api/admin/vendors/[id]",
        entityType: "vendor",
        entityId: id,
        summary: `approve vendor ${id}`,
      });
      return ok({ vendor });
    }

    return badRequest("عملیات نامعتبر است.");
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/admin/vendors/[id]" });
  }
}
