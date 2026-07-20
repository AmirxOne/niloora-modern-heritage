export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { submitVendorProduct } from "@/lib/server/marketplace/vendor-product-service";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    await requireActiveVendorOwner(user.id);

    const { id } = await context.params;
    const result = await submitVendorProduct(user.id, id);
    return ok(result);
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, {
      route: "/api/vendor/products/[id]/submit",
      request,
      role: "vendor",
      journey: "vendor_products",
      action: "vendor_product_submit",
    });
  }
}
