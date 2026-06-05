export { dynamic } from "@/lib/server/route-segment";

import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  getCatalogProducts,
  getProductByIdFromDb,
  getRelatedProducts,
  getSmartRecommendations,
} from "@/lib/server/products";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await getProductByIdFromDb(id);
    if (!product) return notFound("Product not found");

    const catalog = await getCatalogProducts();
    const related = getRelatedProducts(catalog, product.id, 4);
    const smartRecommendations = getSmartRecommendations(catalog, product.id, 5);
    const allBundles = await listActiveBundleOffers();
    const activeBundles = allBundles.filter((bundle) => bundle.requiredProductIds.includes(product.id));
    return ok({ product, related, smartRecommendations, activeBundles });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/[id]" });
  }
}
