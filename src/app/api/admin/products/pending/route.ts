export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getPendingProducts } from "@/lib/server/marketplace/moderation/product-moderation-service";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const products = await getPendingProducts();
    return ok({ products });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/pending" });
  }
}
