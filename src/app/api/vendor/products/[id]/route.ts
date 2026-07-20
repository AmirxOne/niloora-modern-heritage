export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { validateVendorProductInput } from "@/lib/vendor/vendor-product-validation";
import {
  updateVendorProduct,
  type VendorProductInput,
} from "@/lib/server/marketplace/vendor-product-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const { id } = await context.params;
    const body = (await request.json()) as Partial<VendorProductInput>;
    const parsed = validateVendorProductInput(body, "update");
    if (!parsed.ok) return badRequest(parsed.message);

    const product = await updateVendorProduct(user.id, id, parsed.data);
    return ok({ product });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/products/[id]" });
  }
}
