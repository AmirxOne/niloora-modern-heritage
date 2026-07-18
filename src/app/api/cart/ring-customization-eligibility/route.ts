export { dynamic } from "@/lib/server/route-segment";

import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { listEnabledRingCustomizationProductIds } from "@/lib/server/ring-customization/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productIds?: unknown };
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    const enabledProductIds = await listEnabledRingCustomizationProductIds(productIds);
    return ok({ enabledProductIds });
  } catch (error) {
    return handleRouteError(error, { route: "/api/cart/ring-customization-eligibility" });
  }
}
