import type { HomeBannerDto } from "@/lib/types/home-content";
import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";
import { prisma } from "@/lib/server/prisma";

const DEFAULT_ID = "default";

export { defaultHomeBannerDto };

export function mapHomeBanner(row: {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  percent: number;
  ctaLabel: string | null;
  ctaHref: string;
}): HomeBannerDto {
  return {
    enabled: row.enabled,
    badge: row.badge,
    title: row.title,
    subtitle: row.subtitle,
    percent: row.percent,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
  };
}

export async function getHomeBannerSettings(): Promise<HomeBannerDto> {
  const row = await prisma.homeBannerSettings.findUnique({ where: { id: DEFAULT_ID } });
  if (!row) return defaultHomeBannerDto();
  return mapHomeBanner(row);
}

export type SiteWideDiscountConfig = {
  enabled: boolean;
  percent: number;
  title: string;
  description: string;
};

export async function getSiteWideDiscountConfig(): Promise<SiteWideDiscountConfig> {
  const banner = await getHomeBannerSettings();
  return {
    enabled: banner.enabled && banner.percent > 0,
    percent: banner.percent,
    title: banner.title,
    description: banner.subtitle,
  };
}

export async function upsertHomeBannerSettings(
  input: Partial<HomeBannerDto>
): Promise<HomeBannerDto> {
  const current = await getHomeBannerSettings();
  const row = await prisma.homeBannerSettings.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      enabled: input.enabled ?? current.enabled,
      badge: input.badge?.trim() || current.badge,
      title: input.title?.trim() || current.title,
      subtitle: input.subtitle?.trim() || current.subtitle,
      percent: input.percent ?? current.percent,
      ctaLabel:
        input.ctaLabel === undefined
          ? current.ctaLabel
          : input.ctaLabel === null
            ? null
            : input.ctaLabel.trim() || null,
      ctaHref: input.ctaHref?.trim() || current.ctaHref,
    },
    update: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.badge !== undefined ? { badge: input.badge.trim() } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle.trim() } : {}),
      ...(input.percent !== undefined ? { percent: Math.round(input.percent) } : {}),
      ...(input.ctaLabel !== undefined
        ? {
            ctaLabel:
              input.ctaLabel === null ? null : input.ctaLabel.trim() || null,
          }
        : {}),
      ...(input.ctaHref !== undefined ? { ctaHref: input.ctaHref.trim() || "/shop" } : {}),
    },
  });
  return mapHomeBanner(row);
}
