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
    return ok({ deleted: true, id });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/[id]" });
  }
}
