export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { deleteSliderItem, updateSliderItem } from "@/lib/server/home/home-slider";
import { prisma } from "@/lib/server/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.homeSliderItem.findUnique({ where: { id } });
    if (!existing) return notFound("آیتم اسلایدر یافت نشد.");

    const body = (await request.json()) as Record<string, unknown>;
    try {
      const row = await updateSliderItem(id, {
        productId: typeof body.productId === "string" ? body.productId.trim() : undefined,
        bannerImageUrl:
          body.bannerImageUrl === null
            ? null
            : typeof body.bannerImageUrl === "string"
              ? body.bannerImageUrl
              : undefined,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        active: typeof body.active === "boolean" ? body.active : undefined,
      });
      return ok({
        item: {
          id: row.id,
          productId: row.productId,
          bannerImageUrl: row.bannerImageUrl,
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
        return badRequest("محصول یافت نشد.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/slider/[id]" });
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
    const existing = await prisma.homeSliderItem.findUnique({ where: { id } });
    if (!existing) return notFound("آیتم اسلایدر یافت نشد.");

    await deleteSliderItem(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/slider/[id]" });
  }
}
