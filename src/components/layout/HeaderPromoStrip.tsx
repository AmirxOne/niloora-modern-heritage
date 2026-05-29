"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeBannerDto } from "@/lib/types/home-content";
import { isHeaderStripVisible } from "@/lib/home-banner-header-strip";
import { cn } from "@/lib/utils";

export function HeaderPromoStrip({ banner }: { banner: HomeBannerDto }) {
  if (!isHeaderStripVisible(banner)) return null;

  const href = banner.headerStripCtaHref?.trim() || "/shop";
  const isImage = banner.headerStripMode === "image" && banner.headerStripImageUrl?.trim();

  if (isImage) {
    return (
      <Link
        href={href}
        className={cn("header-promo-strip", "header-promo-strip--image")}
        aria-label={banner.headerStripTitle.trim() || "بنر تبلیغاتی"}
      >
        <span className="header-promo-strip__image-wrap">
          <Image
            src={banner.headerStripImageUrl!}
            alt={banner.headerStripTitle.trim() || ""}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="header-promo-strip">
      <span className="header-promo-strip__inner">
        {banner.headerStripBadge.trim() ? (
          <span className="header-promo-strip__badge">{banner.headerStripBadge}</span>
        ) : null}
        {banner.headerStripTitle.trim() ? (
          <span className="header-promo-strip__title">{banner.headerStripTitle}</span>
        ) : null}
        {banner.headerStripSubtitle.trim() ? (
          <span className="header-promo-strip__hint">{banner.headerStripSubtitle}</span>
        ) : null}
        {banner.headerStripCtaLabel ? (
          <span className="header-promo-strip__cta">{banner.headerStripCtaLabel}</span>
        ) : null}
      </span>
    </Link>
  );
}
