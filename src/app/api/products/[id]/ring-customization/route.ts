export { dynamic } from "@/lib/server/route-segment";

import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getProductByIdFromDb } from "@/lib/server/products";
import { getRingCustomizationPublicConfig } from "@/lib/server/ring-customization/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await getProductByIdFromDb(id);
    if (!product) return notFound("محصول یافت نشد.");

    const config = await getRingCustomizationPublicConfig(id);
    if (!config) return badRequest("برای این محصول شخصی‌سازی خرید فعال نیست.");

    return ok({ ringCustomization: config });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/[id]/ring-customization" });
  }
}

