import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { createSliderItem, listAdminSliderItems } from "@/lib/server/home/home-slider";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const items = await listAdminSliderItems();
    return ok({ items });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/slider" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    if (!productId) return badRequest("شناسهٔ محصول الزامی است.");

    try {
      const row = await createSliderItem({
        productId,
        sortOrder: Number(body.sortOrder ?? 0),
        active: body.active !== false,
      });
      return created({
        item: {
          id: row.id,
          productId: row.productId,
          sortOrder: row.sortOrder,
          active: row.active,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PRODUCT_NOT_FOUND") {
          return badRequest("محصول یافت نشد.");
        }
      }
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return badRequest("این محصول قبلاً در اسلایدر است.");
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/slider" });
  }
}
