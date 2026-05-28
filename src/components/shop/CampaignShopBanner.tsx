"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicCampaignDto } from "@/lib/types/campaign";
import { fa } from "@/lib/i18n/fa";

type Props = {
  campaign: PublicCampaignDto;
};

export function CampaignShopBanner({ campaign }: Props) {
  if (!campaign.banner.enabled) return null;

  const title = campaign.banner.title || campaign.title;
  const subtitle = campaign.banner.subtitle || campaign.description;
  const ctaLabel = campaign.banner.ctaLabel || fa.shop.campaignBannerCta;
  const ctaHref = campaign.banner.ctaHref || campaign.shopHref;

  return (
    <div className="site-wide-banner campaign-shop-banner" role="status">
      {campaign.banner.imageUrl ? (
        <div className="campaign-shop-banner-image">
          <Image
            src={campaign.banner.imageUrl}
            alt=""
            width={120}
            height={80}
            className="object-cover"
          />
        </div>
      ) : null}
      <span className="site-wide-banner-badge">
        {campaign.banner.badge || fa.shop.campaignBadge}
      </span>
      <div className="site-wide-banner-text">
        <p className="site-wide-banner-title">{title}</p>
        {subtitle ? <p className="site-wide-banner-hint">{subtitle}</p> : null}
        {campaign.discountType === "percent" ? (
          <p className="site-wide-banner-hint">
            {campaign.discountValue.toLocaleString("fa-IR")}٪ {fa.shop.campaignDiscountHint}
          </p>
        ) : null}
      </div>
      <Link href={ctaHref} className="campaign-shop-banner-cta text-sm text-turquoise">
        {ctaLabel}
      </Link>
    </div>
  );
}
