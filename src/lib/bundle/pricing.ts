import type { AppliedBundleOffer, BundleOfferDefinition, CartItem } from "@/lib/types";

function eligibleSubtotalForBundle(bundle: BundleOfferDefinition, items: CartItem[]): number {
  return items
    .filter((item) => item.productId && bundle.requiredProductIds.includes(item.productId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function hasAllRequiredProducts(bundle: BundleOfferDefinition, items: CartItem[]): boolean {
  const ids = new Set(items.map((item) => item.productId).filter(Boolean) as string[]);
  return bundle.requiredProductIds.every((id) => ids.has(id));
}

export function calculateAppliedBundles(
  items: CartItem[],
  bundles: BundleOfferDefinition[]
): AppliedBundleOffer[] {
  const applied: AppliedBundleOffer[] = [];
  for (const bundle of bundles) {
    if (!bundle.active) continue;
    if (!hasAllRequiredProducts(bundle, items)) continue;
    const base = eligibleSubtotalForBundle(bundle, items);
    if (base <= 0) continue;
    const amount =
      bundle.discountType === "percent"
        ? Math.round(base * (bundle.discountValue / 100))
        : Math.min(bundle.discountValue, base);
    if (amount > 0) {
      applied.push({ bundle, amount });
    }
  }
  return applied;
}

export function totalBundleDiscount(applied: AppliedBundleOffer[]): number {
  return applied.reduce((sum, item) => sum + item.amount, 0);
}
