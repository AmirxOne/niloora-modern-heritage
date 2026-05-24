import type { BundleOffer as PrismaBundleOffer } from "@prisma/client";
import type { BundleOfferDefinition } from "@/lib/types";

export const BUNDLE_DISCOUNT_TYPES = ["percent", "fixed"] as const;

export function parseBundleProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

export function toBundleOfferDefinition(row: PrismaBundleOffer): BundleOfferDefinition {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    discountType: row.discountType as BundleOfferDefinition["discountType"],
    discountValue: row.discountValue,
    requiredProductIds: parseBundleProductIds(row.requiredProductIds),
    active: row.active,
  };
}
