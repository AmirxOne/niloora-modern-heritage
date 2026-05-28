import type { DiscountCampaign as PrismaDiscountCampaign } from "@prisma/client";
import {
  CAMPAIGN_DISCOUNT_TYPES,
  CAMPAIGN_TARGET_SCOPES,
  normalizeCampaignSlug,
  parseCampaignIdList,
  type CampaignDiscountRule,
  type CampaignDiscountType,
  type CampaignTargetScope,
} from "@/lib/campaign/campaign-discount";

export { CAMPAIGN_DISCOUNT_TYPES, CAMPAIGN_TARGET_SCOPES, normalizeCampaignSlug, parseCampaignIdList };
export type { CampaignDiscountRule, CampaignDiscountType, CampaignTargetScope };

export type CampaignBannerDto = {
  enabled: boolean;
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
};

export type PublicCampaignDto = CampaignDiscountRule & {
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  banner: CampaignBannerDto;
  shopHref: string;
};

export type AdminCampaignRecord = PublicCampaignDto & {
  active: boolean;
  linkedPromoCodeId: string | null;
  usageCount: number;
  totalDiscountGiven: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCampaignDetailRecord = AdminCampaignRecord & {
  recentUsages: Array<{
    id: string;
    orderId: string;
    userId: string | null;
    discountAmount: number;
    orderSubtotal: number | null;
    createdAt: string;
  }>;
};

export function isCampaignInSchedule(
  row: Pick<PrismaDiscountCampaign, "startsAt" | "endsAt">,
  at = new Date()
): boolean {
  if (row.startsAt && at < row.startsAt) return false;
  if (row.endsAt && at > row.endsAt) return false;
  return true;
}

export function toCampaignDiscountRule(row: PrismaDiscountCampaign): CampaignDiscountRule {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    discountType: row.discountType as CampaignDiscountType,
    discountValue: row.discountValue,
    minSubtotal: row.minSubtotal,
    targetScope: row.targetScope as CampaignTargetScope,
    targetProductIds: parseCampaignIdList(row.targetProductIds),
    targetCollectionIds: parseCampaignIdList(row.targetCollectionIds),
    priority: row.priority,
    replacesSiteWide: row.replacesSiteWide,
    linkedPromoCode: null,
  };
}

export function mapCampaignBanner(row: PrismaDiscountCampaign): CampaignBannerDto {
  return {
    enabled: row.bannerEnabled,
    badge: row.bannerBadge,
    title: row.bannerTitle,
    subtitle: row.bannerSubtitle,
    ctaLabel: row.bannerCtaLabel,
    ctaHref: row.bannerCtaHref,
    imageUrl: row.bannerImageUrl,
  };
}

export function toPublicCampaignDto(
  row: PrismaDiscountCampaign & { linkedPromoCode?: { code: string } | null }
): PublicCampaignDto {
  const rule = toCampaignDiscountRule(row);
  return {
    ...rule,
    linkedPromoCode: row.linkedPromoCode?.code ?? null,
    description: row.description,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    banner: mapCampaignBanner(row),
    shopHref: `/shop?campaign=${encodeURIComponent(row.slug)}`,
  };
}

export type CampaignUpsertInput = {
  slug: string;
  title: string;
  description: string | null;
  discountType: CampaignDiscountType;
  discountValue: number;
  minSubtotal: number;
  targetScope: CampaignTargetScope;
  targetProductIds: string[];
  targetCollectionIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  priority: number;
  replacesSiteWide: boolean;
  linkedPromoCodeId: string | null;
  bannerEnabled: boolean;
  bannerBadge: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerCtaLabel: string | null;
  bannerCtaHref: string | null;
  bannerImageUrl: string | null;
};

export function validateCampaignInput(input: CampaignUpsertInput): string | null {
  if (!input.title.trim()) return "عنوان کمپین الزامی است.";
  if (!input.slug.trim()) return "شناسهٔ URL (slug) الزامی است.";
  if (!CAMPAIGN_DISCOUNT_TYPES.includes(input.discountType)) {
    return "نوع تخفیف نامعتبر است.";
  }
  if (!CAMPAIGN_TARGET_SCOPES.includes(input.targetScope)) {
    return "محدودهٔ هدف نامعتبر است.";
  }
  if (input.discountValue <= 0) return "مقدار تخفیف باید مثبت باشد.";
  if (input.discountType === "percent" && input.discountValue > 100) {
    return "درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد.";
  }
  if (input.minSubtotal < 0) return "حداقل سبد نامعتبر است.";
  if (input.startsAt && input.endsAt && input.startsAt > input.endsAt) {
    return "تاریخ پایان باید بعد از شروع باشد.";
  }
  if (input.targetScope === "products" && input.targetProductIds.length === 0) {
    return "حداقل یک محصول برای کمپین هدف‌دار انتخاب کنید.";
  }
  if (input.targetScope === "collections" && input.targetCollectionIds.length === 0) {
    return "حداقل یک دسته انتخاب کنید.";
  }
  return null;
}
