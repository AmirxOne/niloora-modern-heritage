import { SITE_WIDE_DISCOUNT } from "@/lib/discounts-config";
import type { HomeBannerDto } from "@/lib/types/home-content";

export function defaultHomeBannerDto(): HomeBannerDto {
  return {
    enabled: SITE_WIDE_DISCOUNT.enabled,
    badge: "بهاکاهی",
    title: SITE_WIDE_DISCOUNT.title,
    subtitle: SITE_WIDE_DISCOUNT.description,
    percent: SITE_WIDE_DISCOUNT.percent,
    ctaLabel: "ورود به گالری",
    ctaHref: "/shop",
  };
}
