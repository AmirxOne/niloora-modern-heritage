import type { DiscountCountdownConfig } from "@/lib/discounts/countdown-shared";
import { resolveDiscountEndsAtFromConfig } from "@/lib/discounts/countdown-shared";

export type { DiscountRemaining } from "@/lib/discount-countdown-math";
export { getDiscountRemaining } from "@/lib/discount-countdown-math";

export function resolveDiscountEndsAt(options?: {
  productEndsAt?: string | null;
  config?: DiscountCountdownConfig | null;
}): Date | null {
  return resolveDiscountEndsAtFromConfig(options?.config, options?.productEndsAt);
}
