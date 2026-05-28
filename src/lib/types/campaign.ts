import type {
  CampaignDiscountRule,
  CampaignDiscountType,
  CampaignTargetScope,
} from "@/lib/campaign/campaign-discount";

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
  linkedPromoCode?: string | null;
};
