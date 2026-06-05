export { dynamic } from "@/lib/server/route-segment";

import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getPreOwnedProductsFromDb } from "@/lib/server/products";

export async function GET() {
  try {
    const products = await getPreOwnedProductsFromDb();
    return ok({ products });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/pre-owned" });
  }
}
