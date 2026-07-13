export { dynamic } from "@/lib/server/route-segment";

import { notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  getCatalogProducts,
  getProductByIdFromDb,
  getRelatedProducts,
  getSameVendorProductsFromDb,
  getSmartRecommendations,
} from "@/lib/server/products";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";
import { isRingCustomizationEnabled } from "@/lib/server/ring-customization/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await getProductByIdFromDb(id);
    if (!product) return notFound("Product not found");

    const [catalog, allBundles, ringCustomizationEnabled] = await Promise.all([
      getCatalogProducts(),
      listActiveBundleOffers(),
      isRingCustomizationEnabled(id),
    ]);
    const related = getRelatedProducts(catalog, product.id, 4);
    const smartRecommendations = getSmartRecommendations(catalog, product.id, 5);
    const vendorProducts =
      product.vendor?.id != null
        ? await getSameVendorProductsFromDb(product.vendor.id, product.id, 8)
        : [];
    const activeBundles = allBundles.filter((bundle) => bundle.requiredProductIds.includes(product.id));
    return ok({
      product,
      related,
      vendorProducts,
      smartRecommendations,
      activeBundles,
      ringCustomizationEnabled,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/[id]" });
  }
}
