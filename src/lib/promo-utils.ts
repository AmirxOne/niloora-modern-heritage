import type { PromoCodeDefinition } from "@/lib/types";

export function calcPromoDiscountAmount(
  subtotalSale: number,
  promo: PromoCodeDefinition
): number {
  if (subtotalSale < promo.minSubtotal) return 0;
  if (promo.type === "percent") {
    return Math.round(subtotalSale * (promo.value / 100));
  }
  return Math.min(subtotalSale, promo.value);
}
