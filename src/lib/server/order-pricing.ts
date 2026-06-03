import { getSiteWideDiscountConfig } from "@/lib/server/home/home-banner";
import { resolveCartLine } from "@/lib/server/orders/resolve-cart-line";
import type { CartItem } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import { validateCartPurchase } from "@/lib/server/products/validate-cart-purchase";
import { calcCampaignForCheckout } from "@/lib/server/campaigns/discount-campaign-service";
import { calcPromoFromCode } from "@/lib/server/promo/promo-code-service";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";
import { calculateAppliedBundles, totalBundleDiscount } from "@/lib/bundle/pricing";
import {
  calculateEarnedLoyaltyPoints,
  calculateLoyaltyDiscountAmount,
  normalizeLoyaltyTier,
} from "@/lib/loyalty/program";

export type PricedOrder = {
  items: Array<CartItem & { quantity: number }>;
  subtotalList: number;
  subtotalSale: number;
  totalFurooh: number;
  payable: number;
  promoCode: string | null;
  bundleDiscount: number;
  appliedBundles: Array<{ id: string; title: string; amount: number }>;
  loyaltyTier: import("@/lib/types").LoyaltyTier;
  loyaltyDiscountAmount: number;
  loyaltyPointsEarned: number;
  campaignId: string | null;
  campaignSlug: string | null;
  campaignTitle: string | null;
  campaignDiscountAmount: number;
};

/**
 * Authoritative checkout pricing. Client `price` / `listPrice` on cart lines are ignored.
 * Used by payment initiation (`createOrderFromCart`) — not by deprecated direct POST /api/orders.
 */
export async function repriceOrderItems(
  incomingItems: CartItem[],
  promoCode: string | null,
  input?: { loyaltyTier?: string | null }
): Promise<PricedOrder> {
  const positiveItems = incomingItems.filter((item) => item.quantity > 0);
  if (positiveItems.length === 0) {
    return {
      items: [],
      subtotalList: 0,
      subtotalSale: 0,
      totalFurooh: 0,
      payable: 0,
      promoCode: null,
      bundleDiscount: 0,
      appliedBundles: [],
      loyaltyTier: "bronze",
      loyaltyDiscountAmount: 0,
      loyaltyPointsEarned: 0,
      campaignId: null,
      campaignSlug: null,
      campaignTitle: null,
      campaignDiscountAmount: 0,
    };
  }

  await validateCartPurchase(positiveItems);

  const productIds = positiveItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          productType: true,
          pieceCode: true,
          sku: true,
          price: true,
          listPrice: true,
          discountPercent: true,
          image: true,
          availability: true,
          collectionId: true,
        },
      })
    : [];

  const hasRingCustomizationLines = positiveItems.some(
    (item) => Boolean(item.productId && item.ringPurchaseCustomization && !item.customizerState)
  );

  const [ringConfigs, ringArtisans, ringPatterns, ringTexts, ringScriptStyles] =
    hasRingCustomizationLines
      ? await Promise.all([
          prisma.productRingCustomizationConfig.findMany({
            where: {
              productId: { in: productIds },
              enabled: true,
            },
            include: {
              allowedShankArtisans: true,
              allowedShankPatterns: true,
              allowedStoneArtisans: true,
              allowedStoneTexts: true,
              allowedScriptStyles: true,
            },
          }),
          prisma.ringCustomizationArtisan.findMany(),
          prisma.ringCustomizationShankPattern.findMany(),
          prisma.ringCustomizationStoneText.findMany(),
          prisma.ringCustomizationScriptStyle.findMany(),
        ])
      : [[], [], [], [], []];

  const byId = new Map(
    products.map((product) => [
      product.id,
      {
        ...product,
        availability: product.availability as import("@/lib/types").ProductAvailability,
      },
    ])
  );
  const ringConfigByProductId = new Map(
    ringConfigs.map((item) => [
      item.productId,
      {
        productId: item.productId,
        enabled: item.enabled,
        sizeBase: item.sizeBase,
        sizeMin: item.sizeMin,
        sizeMax: item.sizeMax,
        sizePricingMode: item.sizePricingMode,
        sizeFixedDelta: item.sizeFixedDelta,
        sizeStepAmount: item.sizeStepAmount,
        shankEnabled: item.shankEnabled,
        shankDefaultIncluded: item.shankDefaultIncluded,
        shankDefaultRemovalCredit: item.shankDefaultRemovalCredit,
        stoneEnabled: item.stoneEnabled,
        stoneDefaultIncluded: item.stoneDefaultIncluded,
        stoneDefaultRemovalCredit: item.stoneDefaultRemovalCredit,
        baseLeadTimeDays: item.baseLeadTimeDays,
        sizeLeadTimeDays: item.sizeLeadTimeDays,
        shankLeadTimeDays: item.shankLeadTimeDays,
        stoneLeadTimeDays: item.stoneLeadTimeDays,
        allowedShankArtisanIds: item.allowedShankArtisans.map((r) => r.artisanId),
        allowedShankPatternIds: item.allowedShankPatterns.map((r) => r.patternId),
        allowedStoneArtisanIds: item.allowedStoneArtisans.map((r) => r.artisanId),
        allowedStoneTextIds: item.allowedStoneTexts.map((r) => r.textId),
        allowedScriptStyleIds: item.allowedScriptStyles.map((r) => r.styleId),
      },
    ])
  );
  const items = positiveItems.map((item) =>
    resolveCartLine(item, byId, {
      ringConfigByProductId,
      catalog: {
        artisansById: new Map(
          ringArtisans.map((a) => [
            a.id,
            { id: a.id, active: a.active, scope: a.scope, priceAdd: a.priceAdd },
          ])
        ),
        shankPatternsById: new Map(
          ringPatterns.map((a) => [a.id, { id: a.id, active: a.active, priceAdd: a.priceAdd }])
        ),
        stoneTextsById: new Map(
          ringTexts.map((a) => [a.id, { id: a.id, active: a.active, priceAdd: a.priceAdd }])
        ),
        scriptStylesById: new Map(
          ringScriptStyles.map((a) => [a.id, { id: a.id, active: a.active, priceAdd: a.priceAdd }])
        ),
      },
    })
  );

  const subtotalList = items.reduce(
    (sum, item) => sum + (item.listPrice ?? item.price) * item.quantity,
    0
  );
  const subtotalSale = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productFurooh = subtotalList - subtotalSale;

  const promo = await calcPromoFromCode(subtotalSale, promoCode);
  const campaignLines = items.map((item) => {
    const product = item.productId ? byId.get(item.productId) : undefined;
    return {
      productId: item.productId ?? null,
      collectionId: product && "collectionId" in product ? product.collectionId : null,
      price: item.price,
      quantity: item.quantity,
    };
  });
  const campaign = await calcCampaignForCheckout(
    campaignLines,
    subtotalSale,
    promo.normalizedCode
  );
  const siteWideDiscount = await getSiteWideDiscountConfig();
  const bundles = await listActiveBundleOffers();

  let siteWide = 0;
  if (
    siteWideDiscount.enabled &&
    siteWideDiscount.percent > 0 &&
    !promo.replacesSiteWide &&
    !campaign.replacesSiteWide
  ) {
    siteWide = Math.round(
      (subtotalSale - promo.amount - campaign.amount) * (siteWideDiscount.percent / 100)
    );
  }

  const checkoutFurooh = promo.amount + siteWide + campaign.amount;
  const appliedBundles = calculateAppliedBundles(items, bundles);
  const bundleDiscount = totalBundleDiscount(appliedBundles);
  const loyaltyTier = normalizeLoyaltyTier(input?.loyaltyTier);
  const loyaltyBase = Math.max(0, subtotalSale - checkoutFurooh - bundleDiscount);
  const loyaltyDiscountAmount = calculateLoyaltyDiscountAmount(loyaltyBase, loyaltyTier);
  const totalFurooh = Math.max(0, productFurooh + checkoutFurooh + bundleDiscount + loyaltyDiscountAmount);
  const payable = Math.max(0, subtotalSale - checkoutFurooh - bundleDiscount - loyaltyDiscountAmount);
  const loyaltyPointsEarned = calculateEarnedLoyaltyPoints(payable, loyaltyTier);

  return {
    items,
    subtotalList,
    subtotalSale,
    totalFurooh,
    payable,
    promoCode: promo.normalizedCode,
    bundleDiscount,
    loyaltyTier,
    loyaltyDiscountAmount,
    loyaltyPointsEarned,
    appliedBundles: appliedBundles.map((item) => ({
      id: item.bundle.id,
      title: item.bundle.title,
      amount: item.amount,
    })),
    campaignId: campaign.campaignId,
    campaignSlug: campaign.campaignSlug,
    campaignTitle: campaign.campaignTitle,
    campaignDiscountAmount: campaign.amount,
  };
}
