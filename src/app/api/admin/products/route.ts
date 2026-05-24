import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError, conflict } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { parseAdminProductBody } from "@/lib/server/products/admin-product";
import {
  createAdminProduct,
  listAdminProducts,
} from "@/lib/server/products/admin-product-service";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const products = await listAdminProducts();
    return ok({ products });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = await request.json();
    const parsed = parseAdminProductBody(body, { requireId: true });
    if (!parsed.ok) return badRequest(parsed.message);

    try {
      const product = await createAdminProduct(parsed.data);
      await writeAdminAuditLog({
        user,
        request,
        action: "admin.products.create",
        route: "/api/admin/products",
        entityType: "product",
        entityId: product.id,
        summary: `create product ${product.id}`,
        payload: { id: product.id, price: product.price, availability: product.availability },
      });
      return created({ product });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PRODUCT_EXISTS") {
          return conflict("محصولی با این شناسه وجود دارد.");
        }
        if (error.message === "COLLECTION_NOT_FOUND") {
          return badRequest("مجموعهٔ انتخاب‌شده یافت نشد.");
        }
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products" });
  }
}
