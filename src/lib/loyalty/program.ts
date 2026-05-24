import type { CartItem } from "@/lib/types";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type LoyaltySnapshot = {
  points: number;
  lifetimeSpend: number;
  tier: LoyaltyTier;
};

type LoyaltyTierConfig = {
  minLifetimeSpend: number;
  checkoutDiscountPercent: number;
  pointsPer100kToman: number;
  freeShippingThreshold?: number;
  perks: string[];
};

export const LOYALTY_TIER_ORDER: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];

export const LOYALTY_TIER_CONFIG: Record<LoyaltyTier, LoyaltyTierConfig> = {
  bronze: {
    minLifetimeSpend: 0,
    checkoutDiscountPercent: 0,
    pointsPer100kToman: 1,
    perks: ["جمع‌آوری امتیاز پایه"],
  },
  silver: {
    minLifetimeSpend: 25_000_000,
    checkoutDiscountPercent: 2,
    pointsPer100kToman: 2,
    perks: ["۲٪ تخفیف باشگاه در checkout", "شتاب امتیاز ۲x"],
  },
  gold: {
    minLifetimeSpend: 80_000_000,
    checkoutDiscountPercent: 4,
    pointsPer100kToman: 3,
    freeShippingThreshold: 8_000_000,
    perks: ["۴٪ تخفیف باشگاه", "ارسال رایگان در سفارش‌های منتخب", "شتاب امتیاز ۳x"],
  },
  platinum: {
    minLifetimeSpend: 180_000_000,
    checkoutDiscountPercent: 6,
    pointsPer100kToman: 4,
    freeShippingThreshold: 4_000_000,
    perks: ["۶٪ تخفیف باشگاه", "اولویت کارگاه", "شتاب امتیاز ۴x"],
  },
};

export function normalizeLoyaltyTier(value: string | null | undefined): LoyaltyTier {
  if (value === "silver" || value === "gold" || value === "platinum" || value === "bronze") {
    return value;
  }
  return "bronze";
}

export function resolveTierByLifetimeSpend(lifetimeSpend: number): LoyaltyTier {
  const spend = Math.max(0, lifetimeSpend);
  if (spend >= LOYALTY_TIER_CONFIG.platinum.minLifetimeSpend) return "platinum";
  if (spend >= LOYALTY_TIER_CONFIG.gold.minLifetimeSpend) return "gold";
  if (spend >= LOYALTY_TIER_CONFIG.silver.minLifetimeSpend) return "silver";
  return "bronze";
}

export function tierCheckoutDiscountPercent(tier: LoyaltyTier): number {
  return LOYALTY_TIER_CONFIG[tier].checkoutDiscountPercent;
}

export function calculateLoyaltyDiscountAmount(subtotalAfterOtherDiscounts: number, tier: LoyaltyTier): number {
  const subtotal = Math.max(0, subtotalAfterOtherDiscounts);
  const percent = tierCheckoutDiscountPercent(tier);
  if (percent <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * (percent / 100));
}

export function calculateEarnedLoyaltyPoints(orderPayableBeforeShipping: number, tier: LoyaltyTier): number {
  const toman = Math.max(0, orderPayableBeforeShipping);
  if (toman <= 0) return 0;
  const baseUnits = Math.floor(toman / 100_000);
  return baseUnits * LOYALTY_TIER_CONFIG[tier].pointsPer100kToman;
}

export function summarizeTierPerks(tier: LoyaltyTier): string[] {
  return LOYALTY_TIER_CONFIG[tier].perks;
}

export function buildLoyaltySnapshot(input?: Partial<LoyaltySnapshot>): LoyaltySnapshot {
  const lifetimeSpend = Math.max(0, input?.lifetimeSpend ?? 0);
  const points = Math.max(0, input?.points ?? 0);
  const tier = normalizeLoyaltyTier(input?.tier);
  return { points, lifetimeSpend, tier };
}

export function calculateLoyaltyPreviewFromCart(
  cartItems: CartItem[],
  payableAfterOtherDiscounts: number,
  currentTier: LoyaltyTier
): { projectedPoints: number; nextTier?: LoyaltyTier; amountToNextTier?: number } {
  void cartItems;
  const projectedPoints = calculateEarnedLoyaltyPoints(payableAfterOtherDiscounts, currentTier);
  return { projectedPoints };
}
