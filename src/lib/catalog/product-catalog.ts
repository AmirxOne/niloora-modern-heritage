import { getProductPricing } from "@/lib/pricing";
import type { Product } from "@/lib/types";

type ProductSearchFields = Pick<
  Product,
  "name" | "namePersian" | "collection" | "listing"
>;

type ProductPricingFields = Pick<Product, "price" | "listPrice" | "discountPercent">;

/** Canonical sale/list/discount fields — same rules as ProductCard + cart sanitize. */
export function normalizeCatalogProductPricing(
  product: ProductPricingFields
): ProductPricingFields {
  const pricing = getProductPricing(product);
  return {
    price: pricing.salePrice,
    listPrice: pricing.hasProductFurooh ? pricing.listPrice : undefined,
    discountPercent: pricing.hasProductFurooh ? pricing.furoohPercent : undefined,
  };
}

export function getProductSearchHaystack(product: ProductSearchFields): string {
  return [
    product.name,
    product.namePersian,
    product.collection ?? "",
    product.listing?.headline ?? "",
    ...(product.listing?.details ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesProductSearchQuery(product: ProductSearchFields, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return getProductSearchHaystack(product).includes(q);
}

export function getCatalogMaxPrice(catalog: Pick<Product, "price">[]): number {
  if (catalog.length === 0) return 0;
  return Math.max(...catalog.map((p) => p.price));
}
