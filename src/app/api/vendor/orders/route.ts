export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { listVendorOrders } from "@/lib/server/marketplace/vendor-product-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const orders = await listVendorOrders(user.id);
    return ok({ orders });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/orders" });
  }
}
