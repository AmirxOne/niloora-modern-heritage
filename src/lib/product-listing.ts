import { fa } from "@/lib/i18n/fa";
import type { Product, ProductListing } from "@/lib/types";

export function getProductListingTags(listing: ProductListing): string[] {
  const tags: string[] = [
    listing.tier === "premium" ? fa.productListing.tierPremium : fa.productListing.tierEconomy,
    fa.productListing.tagRing,
  ];
  if (listing.extraTags?.includes("pre-owned")) {
    tags.push(fa.productListing.tagPreOwned);
  }
  return tags;
}

/** پیش‌نمایش یک‌خطی برای اسلایدر و کارت */
export function getProductListingPreview(product: Product, lineCount = 2): string {
  const lines = [product.listing.headline, ...product.listing.details];
  return lines.slice(0, lineCount).join(" · ");
}
