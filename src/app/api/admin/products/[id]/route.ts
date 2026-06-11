export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminProductBody } from "@/lib/server/products/admin-product";
import {
  deleteAdminProduct,
  getAdminProductById,
  updateAdminProduct,
} from "@/lib/server/products/admin-product-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { dispatchBackInStockAlerts } from "@/lib/server/notifications/back-in-stock-dispatch";

function isPurchasable(availability: string, stock: number): boolean {
  return availability !== "sold" && stock > 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const product = await getAdminProductById(id);
    if (!product) return notFound("محصول یافت نشد.");

    return ok({ product });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]" });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = parseAdminProductBody(body, { existingId: id });
    if (!parsed.ok) return badRequest(parsed.message);

    const existing = await getAdminProductById(id);
    if (!existing) return notFound("محصول یافت نشد.");

    try {
      const product = await updateAdminProduct(id, parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.products.update",
        route: "/api/admin/products/[id]",
        entityType: "product",
        entityId: id,
        summary: `update product ${id}`,
        payload: { id, price: product.price, availability: product.availability, stock: product.stock },
      });

      // Auto-fire back-in-stock alerts when the product becomes purchasable again
      // (was sold/out-of-stock, now available). Failures here must not break the
      // admin update, so they are swallowed and observed separately.
      const becameAvailable =
        !isPurchasable(existing.availability, existing.stock) &&
        isPurchasable(product.availability, product.stock);
      if (becameAvailable) {
        try {
          await dispatchBackInStockAlerts({ productId: id });
        } catch (notifyError) {
          console.error("back-in-stock auto-dispatch failed", notifyError);
        }
      }

      return ok({ product });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "COLLECTION_NOT_FOUND") {
          return badRequest("مجموعهٔ انتخاب‌شده یافت نشد.");
        }
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]" });
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
    const existing = await getAdminProductById(id);
    if (!existing) return notFound("محصول یافت نشد.");

    await deleteAdminProduct(id);
    await writeAdminAuditLog({
      user,
      request: _request,
      action: "admin.products.delete",
      route: "/api/admin/products/[id]",
      entityType: "product",
      entityId: id,
      summary: `delete product ${id}`,
      payload: { id },
    });
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]" });
  }
}
