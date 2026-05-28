import type { AdminCampaignRecord } from "@/lib/server/campaigns/discount-campaign";
import type { CampaignDiscountType, CampaignTargetScope } from "@/lib/campaign/campaign-discount";

export type AdminCampaignFormValues = {
  slug: string;
  title: string;
  description: string;
  discountType: CampaignDiscountType;
  discountValue: string;
  minSubtotal: string;
  targetScope: CampaignTargetScope;
  targetProductIds: string;
  targetCollectionIds: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  priority: string;
  replacesSiteWide: boolean;
  linkedPromoCodeId: string;
  bannerEnabled: boolean;
  bannerBadge: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaLabel: string;
  bannerCtaHref: string;
  bannerImageUrl: string;
};

export function emptyAdminCampaignForm(): AdminCampaignFormValues {
  return {
    slug: "",
    title: "",
    description: "",
    discountType: "percent",
    discountValue: "",
    minSubtotal: "0",
    targetScope: "all",
    targetProductIds: "",
    targetCollectionIds: "",
    startsAt: "",
    endsAt: "",
    active: true,
    priority: "0",
    replacesSiteWide: false,
    linkedPromoCodeId: "",
    bannerEnabled: false,
    bannerBadge: "",
    bannerTitle: "",
    bannerSubtitle: "",
    bannerCtaLabel: "",
    bannerCtaHref: "",
    bannerImageUrl: "",
  };
}

export function adminCampaignToForm(record: AdminCampaignRecord): AdminCampaignFormValues {
  return {
    slug: record.slug,
    title: record.title,
    description: record.description ?? "",
    discountType: record.discountType,
    discountValue: String(record.discountValue),
    minSubtotal: String(record.minSubtotal),
    targetScope: record.targetScope,
    targetProductIds: record.targetProductIds.join("\n"),
    targetCollectionIds: record.targetCollectionIds.join(", "),
    startsAt: record.startsAt ? record.startsAt.slice(0, 16) : "",
    endsAt: record.endsAt ? record.endsAt.slice(0, 16) : "",
    active: record.active,
    priority: String(record.priority),
    replacesSiteWide: record.replacesSiteWide,
    linkedPromoCodeId: record.linkedPromoCodeId ?? "",
    bannerEnabled: record.banner.enabled,
    bannerBadge: record.banner.badge ?? "",
    bannerTitle: record.banner.title ?? "",
    bannerSubtitle: record.banner.subtitle ?? "",
    bannerCtaLabel: record.banner.ctaLabel ?? "",
    bannerCtaHref: record.banner.ctaHref ?? "",
    bannerImageUrl: record.banner.imageUrl ?? "",
  };
}

export function adminCampaignFormToPayload(values: AdminCampaignFormValues) {
  return {
    slug: values.slug,
    title: values.title,
    description: values.description.trim() || null,
    discountType: values.discountType,
    discountValue: Number(values.discountValue.replace(/[^\d]/g, "")),
    minSubtotal: Number(values.minSubtotal.replace(/[^\d]/g, "") || "0"),
    targetScope: values.targetScope,
    targetProductIds: values.targetProductIds
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    targetCollectionIds: values.targetCollectionIds
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
    endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    active: values.active,
    priority: Number(values.priority.replace(/[^\d-]/g, "") || "0"),
    replacesSiteWide: values.replacesSiteWide,
    linkedPromoCodeId: values.linkedPromoCodeId.trim() || null,
    bannerEnabled: values.bannerEnabled,
    bannerBadge: values.bannerBadge.trim() || null,
    bannerTitle: values.bannerTitle.trim() || null,
    bannerSubtitle: values.bannerSubtitle.trim() || null,
    bannerCtaLabel: values.bannerCtaLabel.trim() || null,
    bannerCtaHref: values.bannerCtaHref.trim() || null,
    bannerImageUrl: values.bannerImageUrl.trim() || null,
  };
}
