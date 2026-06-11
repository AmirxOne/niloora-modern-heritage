import { SITE_WIDE_DISCOUNT } from "@/lib/discounts-config";
import type { BundleOfferDefinition, CartItem, Product, PromoCodeDefinition } from "@/lib/types";
import { calculateAppliedBundles, totalBundleDiscount } from "@/lib/bundle/pricing";
import { calculateLoyaltyDiscountAmount, normalizeLoyaltyTier } from "@/lib/loyalty/program";

export type SiteWideDiscountInput = {
  enabled: boolean;
  percent: number;
};
import {
  pickBestCampaignForCart,
  type CampaignLineInput,
} from "@/lib/campaign/campaign-discount";
import type { PublicCampaignDto } from "@/lib/types/campaign";
import { calcPromoDiscountAmount } from "@/lib/promo-utils";

export {
  defaultCustomizerState,
  calculateCustomizerPrice,
} from "@/lib/customizer-pricing";

export interface ProductPricing {
  listPrice: number;
  salePrice: number;
  productFurooh: number;
  furoohPercent: number;
  hasProductFurooh: boolean;
}

export interface CartLinePricing {
  itemId: string;
  quantity: number;
  unitListPrice: number;
  unitSalePrice: number;
  lineListTotal: number;
  lineSaleTotal: number;
  lineProductFurooh: number;
}

export interface CartPricingBreakdown {
  lines: CartLinePricing[];
  subtotalList: number;
  subtotalSale: number;
  productFurooh: number;
  siteWideFurooh: number;
  promoFurooh: number;
  campaignFurooh: number;
  appliedCampaign: PublicCampaignDto | null;
  checkoutFurooh: number;
  totalFurooh: number;
  payable: number;
  bundleFurooh: number;
  loyaltyFurooh: number;
  loyaltyTier: import("@/lib/types").LoyaltyTier;
  loyaltyDiscountPercent: number;
  appliedBundles: import("@/lib/types").AppliedBundleOffer[];
  siteWideActive: boolean;
  siteWidePercent: number;
  appliedPromo: PromoCodeDefinition | null;
  promoCodeInput: string | null;
  giftCardApplied: number;
  giftCardCode: string | null;
  payableAfterGiftCard: number;
}

export function isTimedDiscountExpired(discountEndsAt?: string | Date | null): boolean {
  if (discountEndsAt == null) return false;
  const endsAt = new Date(discountEndsAt).getTime();
  if (Number.isNaN(endsAt)) return false;
  return endsAt <= Date.now();
}

export function getProductPricing(
  product: Pick<Product, "price" | "listPrice" | "discountPercent"> & {
    discountEndsAt?: string | Date | null;
  }
): ProductPricing {
  const listPrice = product.listPrice ?? product.price;
  let salePrice = product.price;

  if (isTimedDiscountExpired(product.discountEndsAt)) {
    // The timed discount window has closed: revert to the full (list) price so
    // an expired offer is never honoured at checkout or in the storefront.
    salePrice = listPrice;
  } else if (product.discountPercent != null && product.discountPercent > 0) {
    salePrice = Math.round(listPrice * (1 - product.discountPercent / 100));
  }

  salePrice = Math.min(salePrice, listPrice);
  const productFurooh = Math.max(0, listPrice - salePrice);
  const furoohPercent = listPrice > 0 ? Math.round((productFurooh / listPrice) * 100) : 0;

  return {
    listPrice,
    salePrice,
    productFurooh,
    furoohPercent,
    hasProductFurooh: productFurooh > 0,
  };
}

export function calculateCartPricing(
  items: CartItem[],
  appliedPromo: PromoCodeDefinition | null,
  appliedPromoCode: string | null,
  siteWide: SiteWideDiscountInput = SITE_WIDE_DISCOUNT,
  bundles: BundleOfferDefinition[] = [],
  giftCardInput?: { code: string | null; appliedAmount: number | null },
  loyaltyInput?: { tier?: import("@/lib/types").LoyaltyTier | null },
  campaigns: PublicCampaignDto[] = []
): CartPricingBreakdown {
  const lines: CartLinePricing[] = items.map((item) => {
    const unitListPrice = item.listPrice ?? item.price;
    const unitSalePrice = item.price;
    const quantity = item.quantity;
    return {
      itemId: item.id,
      quantity,
      unitListPrice,
      unitSalePrice,
      lineListTotal: unitListPrice * quantity,
      lineSaleTotal: unitSalePrice * quantity,
      lineProductFurooh: Math.max(0, (unitListPrice - unitSalePrice) * quantity),
    };
  });

  const subtotalList = lines.reduce((s, l) => s + l.lineListTotal, 0);
  const subtotalSale = lines.reduce((s, l) => s + l.lineSaleTotal, 0);
  const productFurooh = lines.reduce((s, l) => s + l.lineProductFurooh, 0);

  const promoValid =
    appliedPromo && subtotalSale >= appliedPromo.minSubtotal ? appliedPromo : null;

  let siteWideFurooh = 0;
  let promoFurooh = 0;

  if (promoValid) {
    promoFurooh = calcPromoDiscountAmount(subtotalSale, promoValid);
  }

  const campaignLines: CampaignLineInput[] = items.map((item) => ({
    productId: item.productId ?? null,
    collectionId: item.collectionId ?? null,
    price: item.price,
    quantity: item.quantity,
  }));
  const campaignPick = pickBestCampaignForCart(
    campaigns,
    campaignLines,
    subtotalSale,
    appliedPromoCode
  );
  const campaignFurooh = campaignPick?.amount ?? 0;
  const appliedCampaign = campaignPick
    ? (campaigns.find((c) => c.id === campaignPick.campaign.id) ?? null)
    : null;
  const campaignReplacesSiteWide = campaignPick?.campaign.replacesSiteWide ?? false;

  if (campaignReplacesSiteWide) {
    siteWideFurooh = 0;
  } else if (siteWide.enabled && siteWide.percent > 0 && !promoValid?.replacesSiteWide) {
    siteWideFurooh = Math.round(
      (subtotalSale - promoFurooh - campaignFurooh) * (siteWide.percent / 100)
    );
  }

  const checkoutFurooh = siteWideFurooh + promoFurooh + campaignFurooh;
  const appliedBundles = calculateAppliedBundles(items, bundles);
  const bundleFurooh = totalBundleDiscount(appliedBundles);
  const loyaltyTier = normalizeLoyaltyTier(loyaltyInput?.tier);
  const loyaltyBase = Math.max(0, subtotalSale - checkoutFurooh - bundleFurooh);
  const loyaltyFurooh = calculateLoyaltyDiscountAmount(loyaltyBase, loyaltyTier);
  const loyaltyDiscountPercent =
    loyaltyTier === "platinum" ? 6 : loyaltyTier === "gold" ? 4 : loyaltyTier === "silver" ? 2 : 0;
  const totalFurooh = productFurooh + checkoutFurooh + bundleFurooh + loyaltyFurooh;
  const payable = Math.max(0, subtotalSale - checkoutFurooh - bundleFurooh - loyaltyFurooh);
  const giftCardApplied = Math.max(0, Math.min(payable, giftCardInput?.appliedAmount ?? 0));
  const payableAfterGiftCard = Math.max(0, payable - giftCardApplied);

  return {
    lines,
    subtotalList,
    subtotalSale,
    productFurooh,
    siteWideFurooh,
    promoFurooh,
    campaignFurooh,
    appliedCampaign,
    checkoutFurooh,
    totalFurooh,
    payable,
    bundleFurooh,
    loyaltyFurooh,
    loyaltyTier,
    loyaltyDiscountPercent,
    appliedBundles,
    siteWideActive:
      siteWide.enabled && !promoValid?.replacesSiteWide && !campaignReplacesSiteWide,
    siteWidePercent: siteWide.percent,
    appliedPromo: promoValid,
    promoCodeInput: appliedPromoCode,
    giftCardApplied,
    giftCardCode: giftCardInput?.code ?? null,
    payableAfterGiftCard,
  };
}
