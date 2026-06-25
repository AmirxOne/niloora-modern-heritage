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

const HIDDEN_LISTING_DETAIL_LABELS = ["تاریخ ثبت", "تگ‌ها", "عنوان"] as const;

function formatListingDetailLine(line: string): string {
  return line.replace(/^(\s*)دسته(\s*):/, `$1${fa.productListing.categoryLabel}$2:`);
}

export function getVisibleListingDetails(details: string[]): string[] {
  return details
    .filter((line) => {
      const trimmed = line.trim();
      return !HIDDEN_LISTING_DETAIL_LABELS.some((label) =>
        new RegExp(`^${label}\\s*:`).test(trimmed)
      );
    })
    .map(formatListingDetailLine);
}

export type ListingDetailEntry = { key: string; value: string };

export const LISTING_DETAIL_PREVIEW_COUNT = 6;

export function parseListingDetailLine(line: string): ListingDetailEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return { key: trimmed, value: "" };
  const key = trimmed.slice(0, colonIndex).trim();
  if (!key) return null;
  return { key, value: trimmed.slice(colonIndex + 1).trim() };
}

export function getListingDetailEntries(details: string[]): ListingDetailEntry[] {
  return getVisibleListingDetails(details)
    .map(parseListingDetailLine)
    .filter((entry): entry is ListingDetailEntry => entry !== null);
}

export function getListingDetailPreview(
  details: string[],
  count = LISTING_DETAIL_PREVIEW_COUNT
): ListingDetailEntry[] {
  return getListingDetailEntries(details).slice(0, count);
}

/** پیش‌نمایش یک‌خطی برای اسلایدر و کارت */
export function getProductListingPreview(product: Product, lineCount = 2): string {
  const lines = [product.listing.headline, ...product.listing.details];
  return lines.slice(0, lineCount).join(" · ");
}
