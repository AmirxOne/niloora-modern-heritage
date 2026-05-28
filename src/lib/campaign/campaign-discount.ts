import { calcPromoDiscountAmount } from "@/lib/promo-utils";
import type { PromoCodeDefinition } from "@/lib/types";

export const CAMPAIGN_TARGET_SCOPES = ["all", "products", "collections"] as const;
export type CampaignTargetScope = (typeof CAMPAIGN_TARGET_SCOPES)[number];

export const CAMPAIGN_DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type CampaignDiscountType = (typeof CAMPAIGN_DISCOUNT_TYPES)[number];

export type CampaignDiscountRule = {
  id: string;
  slug: string;
  title: string;
  discountType: CampaignDiscountType;
  discountValue: number;
  minSubtotal: number;
  targetScope: CampaignTargetScope;
  targetProductIds: string[];
  targetCollectionIds: string[];
  priority: number;
  replacesSiteWide: boolean;
  linkedPromoCode?: string | null;
};

export type CampaignLineInput = {
  productId?: string | null;
  collectionId?: string | null;
  price: number;
  quantity: number;
};

export function parseCampaignIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

export function normalizeCampaignSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productMatchesCampaignTarget(
  product: { productId?: string | null; collectionId?: string | null },
  campaign: Pick<CampaignDiscountRule, "targetScope" | "targetProductIds" | "targetCollectionIds">
): boolean {
  if (campaign.targetScope === "all") return true;
  if (campaign.targetScope === "products") {
    const id = product.productId?.trim();
    return Boolean(id && campaign.targetProductIds.includes(id));
  }
  if (campaign.targetScope === "collections") {
    const id = product.collectionId?.trim();
    return Boolean(id && campaign.targetCollectionIds.includes(id));
  }
  return false;
}

export function calcCampaignDiscountAmount(
  eligibleSubtotal: number,
  campaign: Pick<CampaignDiscountRule, "discountType" | "discountValue" | "minSubtotal">
): number {
  const promoLike: PromoCodeDefinition = {
    id: "campaign",
    code: "",
    label: "",
    type: campaign.discountType,
    value: campaign.discountValue,
    minSubtotal: campaign.minSubtotal,
    replacesSiteWide: false,
  };
  return calcPromoDiscountAmount(eligibleSubtotal, promoLike);
}

export function pickBestCampaignForCart(
  campaigns: CampaignDiscountRule[],
  lines: CampaignLineInput[],
  subtotalSale: number,
  promoCode: string | null
): { campaign: CampaignDiscountRule; amount: number; eligibleSubtotal: number } | null {
  const eligible = campaigns.filter((c) => {
    if (c.linkedPromoCode) {
      const linked = c.linkedPromoCode.trim().toUpperCase();
      const applied = promoCode?.trim().toUpperCase();
      if (!linked || !applied || linked !== applied) return false;
    }
    return true;
  });

  let best: { campaign: CampaignDiscountRule; amount: number; eligibleSubtotal: number } | null =
    null;

  for (const campaign of eligible) {
    const eligibleSubtotal = lines.reduce((sum, line) => {
      if (!productMatchesCampaignTarget(line, campaign)) return sum;
      return sum + line.price * line.quantity;
    }, 0);
    if (eligibleSubtotal <= 0) continue;
    if (subtotalSale < campaign.minSubtotal) continue;

    const amount = calcCampaignDiscountAmount(eligibleSubtotal, campaign);
    if (amount <= 0) continue;

    if (
      !best ||
      amount > best.amount ||
      (amount === best.amount && campaign.priority > best.campaign.priority)
    ) {
      best = { campaign, amount, eligibleSubtotal };
    }
  }

  return best;
}
