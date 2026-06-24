export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import {
  approveProduct,
  editAndApproveProduct,
  rejectProduct,
} from "@/lib/server/marketplace/moderation/product-moderation-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: "approve" | "reject" | "edit_and_approve";
      reason?: string;
      note?: string;
      patch?: Record<string, unknown>;
    };

    if (body.action === "reject") {
      if (!body.reason?.trim()) return badRequest("دلیل رد الزامی است.");
      const product = await rejectProduct({
        productId: id,
        actorUserId: user!.id,
        actorRole: user!.role ?? "admin",
        reason: body.reason,
      });
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.products.reject",
        route: "/api/admin/products/[id]/moderate",
        entityType: "product",
        entityId: id,
        summary: `reject product ${id}`,
      });
      return ok({ product });
    }

    if (body.action === "edit_and_approve") {
      const product = await editAndApproveProduct({
        productId: id,
        actorUserId: user!.id,
        actorRole: user!.role ?? "admin",
        note: body.note,
        patch: (body.patch ?? {}) as Parameters<typeof editAndApproveProduct>[0]["patch"],
      });
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.products.edit_and_approve",
        route: "/api/admin/products/[id]/moderate",
        entityType: "product",
        entityId: id,
        summary: `edit and approve product ${id}`,
      });
      return ok({ product });
    }

    if (body.action === "approve" || !body.action) {
      const product = await approveProduct({
        productId: id,
        actorUserId: user!.id,
        actorRole: user!.role ?? "admin",
        note: body.note,
      });
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.products.approve",
        route: "/api/admin/products/[id]/moderate",
        entityType: "product",
        entityId: id,
        summary: `approve product ${id}`,
      });
      return ok({ product });
    }

    return badRequest("عملیات نامعتبر است.");
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/admin/products/[id]/moderate" });
  }
}
