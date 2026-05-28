import type { PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  LOYALTY_TIER_ORDER,
  LOYALTY_TIER_CONFIG,
  normalizeLoyaltyTier,
  resolveTierByLifetimeSpend,
  type LoyaltyTier,
} from "@/lib/loyalty/program";
import type { LoyaltySummary } from "@/lib/types";

function nextTier(tier: LoyaltyTier): LoyaltyTier | undefined {
  const idx = LOYALTY_TIER_ORDER.indexOf(tier);
  if (idx < 0 || idx >= LOYALTY_TIER_ORDER.length - 1) return undefined;
  return LOYALTY_TIER_ORDER[idx + 1];
}

export function buildLoyaltySummary(input: {
  points?: number | null;
  tier?: string | null;
  lifetimeSpend?: number | null;
}): LoyaltySummary {
  const points = Math.max(0, input.points ?? 0);
  const lifetimeSpend = Math.max(0, input.lifetimeSpend ?? 0);
  const tier = normalizeLoyaltyTier(input.tier);
  const projectedTier = resolveTierByLifetimeSpend(lifetimeSpend);
  const effectiveTier = LOYALTY_TIER_ORDER.indexOf(projectedTier) > LOYALTY_TIER_ORDER.indexOf(tier) ? projectedTier : tier;
  const next = nextTier(effectiveTier);
  const amountToNextTier = next
    ? Math.max(0, LOYALTY_TIER_CONFIG[next].minLifetimeSpend - lifetimeSpend)
    : undefined;

  return {
    points,
    lifetimeSpend,
    tier: effectiveTier,
    tierDiscountPercent: LOYALTY_TIER_CONFIG[effectiveTier].checkoutDiscountPercent,
    perks: LOYALTY_TIER_CONFIG[effectiveTier].perks,
    nextTier: next,
    amountToNextTier,
  };
}

export async function rewardLoyaltyOnPaidOrder(
  tx: Prisma.TransactionClient | PrismaClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      total: true,
      shippingCost: true,
      loyaltyPointsEarned: true,
      loyaltyTier: true,
      orderType: true,
    },
  });
  if (!order) return;
  if (order.status !== "processing") return;
  if (order.orderType !== "product") return;
  const points = Math.max(0, order.loyaltyPointsEarned ?? 0);
  const lifetimeIncrease = Math.max(0, order.total - (order.shippingCost ?? 0));
  if (points <= 0 && lifetimeIncrease <= 0) return;

  const user = await tx.user.findUnique({
    where: { id: order.userId },
    select: { loyaltyPoints: true, loyaltyLifetimeSpend: true, loyaltyTier: true },
  });
  if (!user) return;

  const nextLifetimeSpend = Math.max(0, (user.loyaltyLifetimeSpend ?? 0) + lifetimeIncrease);
  const nextPoints = Math.max(0, (user.loyaltyPoints ?? 0) + points);
  const computedTier = resolveTierByLifetimeSpend(nextLifetimeSpend);
  const currentTier = normalizeLoyaltyTier(user.loyaltyTier);
  const tier =
    LOYALTY_TIER_ORDER.indexOf(computedTier) > LOYALTY_TIER_ORDER.indexOf(currentTier)
      ? computedTier
      : currentTier;

  await tx.user.update({
    where: { id: order.userId },
    data: {
      loyaltyPoints: nextPoints,
      loyaltyLifetimeSpend: nextLifetimeSpend,
      loyaltyTier: tier,
    },
  });
}

export async function getUserLoyaltySummary(userId: string): Promise<LoyaltySummary> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        loyaltyLifetimeSpend: true,
      },
    });
    return buildLoyaltySummary({
      points: user?.loyaltyPoints ?? 0,
      tier: user?.loyaltyTier ?? "bronze",
      lifetimeSpend: user?.loyaltyLifetimeSpend ?? 0,
    });
  } catch {
    return buildLoyaltySummary({});
  }
}
