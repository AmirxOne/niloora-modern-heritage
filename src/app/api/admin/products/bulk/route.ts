import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminProductBulkBody } from "@/lib/server/products/admin-product";
import { bulkUpdateAdminProducts } from "@/lib/server/products/admin-product-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function PATCH(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = await request.json();
    const parsed = parseAdminProductBulkBody(body);
    if (!parsed.ok) return badRequest(parsed.message);

    const result = await bulkUpdateAdminProducts(parsed.data);
    await writeAdminAuditLog({
      user,
      request,
      action: "admin.products.bulk_update",
      route: "/api/admin/products/bulk",
      entityType: "product",
      summary: `bulk update ${result.updated.length} products`,
      payload: {
        ids: parsed.data.ids,
        fields: {
          price: parsed.data.price,
          stock: parsed.data.stock,
          availability: parsed.data.availability,
          discountPercent: parsed.data.discountPercent,
        },
        missingIds: result.missingIds,
      },
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/bulk" });
  }
}
