import type { HomeBannerDto, HomeBannerHeaderStripMode } from "@/lib/types/home-content";
import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";
import { prisma } from "@/lib/server/prisma";

const DEFAULT_ID = "default";

export { defaultHomeBannerDto };

function parseHeaderStripMode(value: string | null | undefined): HomeBannerHeaderStripMode {
  return value === "image" ? "image" : "text";
}

export function mapHomeBanner(row: {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  percent: number;
  countdownEnabled: boolean;
  countdownEndsAt: Date | null;
  ctaLabel: string | null;
  ctaHref: string;
  headerStripEnabled: boolean;
  headerStripMode: string;
  headerStripImageUrl: string | null;
  headerStripBadge: string;
  headerStripTitle: string;
  headerStripSubtitle: string;
  headerStripCtaLabel: string | null;
  headerStripCtaHref: string;
}): HomeBannerDto {
  return {
    enabled: row.enabled,
    badge: row.badge,
    title: row.title,
    subtitle: row.subtitle,
    percent: row.percent,
    countdownEnabled: row.countdownEnabled,
    countdownEndsAt: row.countdownEndsAt?.toISOString() ?? null,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    headerStripEnabled: row.headerStripEnabled,
    headerStripMode: parseHeaderStripMode(row.headerStripMode),
    headerStripImageUrl: row.headerStripImageUrl,
    headerStripBadge: row.headerStripBadge,
    headerStripTitle: row.headerStripTitle,
    headerStripSubtitle: row.headerStripSubtitle,
    headerStripCtaLabel: row.headerStripCtaLabel,
    headerStripCtaHref: row.headerStripCtaHref,
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
  const headerStripMode =
    input.headerStripMode !== undefined
      ? input.headerStripMode
      : current.headerStripMode;

  const row = await prisma.homeBannerSettings.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      enabled: input.enabled ?? current.enabled,
      badge: input.badge?.trim() || current.badge,
      title: input.title?.trim() || current.title,
      subtitle: input.subtitle?.trim() || current.subtitle,
      percent: input.percent ?? current.percent,
      countdownEnabled: input.countdownEnabled ?? current.countdownEnabled,
      countdownEndsAt:
        input.countdownEndsAt === undefined
          ? current.countdownEndsAt
            ? new Date(current.countdownEndsAt)
            : null
          : input.countdownEndsAt
            ? new Date(input.countdownEndsAt)
            : null,
      ctaLabel:
        input.ctaLabel === undefined
          ? current.ctaLabel
          : input.ctaLabel === null
            ? null
            : input.ctaLabel.trim() || null,
      ctaHref: input.ctaHref?.trim() || current.ctaHref,
      headerStripEnabled: input.headerStripEnabled ?? current.headerStripEnabled,
      headerStripMode,
      headerStripImageUrl:
        input.headerStripImageUrl === undefined
          ? current.headerStripImageUrl
          : input.headerStripImageUrl === null
            ? null
            : input.headerStripImageUrl.trim() || null,
      headerStripBadge: input.headerStripBadge?.trim() ?? current.headerStripBadge,
      headerStripTitle: input.headerStripTitle?.trim() ?? current.headerStripTitle,
      headerStripSubtitle: input.headerStripSubtitle?.trim() ?? current.headerStripSubtitle,
      headerStripCtaLabel:
        input.headerStripCtaLabel === undefined
          ? current.headerStripCtaLabel
          : input.headerStripCtaLabel === null
            ? null
            : input.headerStripCtaLabel.trim() || null,
      headerStripCtaHref: input.headerStripCtaHref?.trim() || current.headerStripCtaHref,
    },
    update: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.badge !== undefined ? { badge: input.badge.trim() } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle.trim() } : {}),
      ...(input.percent !== undefined ? { percent: Math.round(input.percent) } : {}),
      ...(input.countdownEnabled !== undefined ? { countdownEnabled: input.countdownEnabled } : {}),
      ...(input.countdownEndsAt !== undefined
        ? { countdownEndsAt: input.countdownEndsAt ? new Date(input.countdownEndsAt) : null }
        : {}),
      ...(input.ctaLabel !== undefined
        ? {
            ctaLabel:
              input.ctaLabel === null ? null : input.ctaLabel.trim() || null,
          }
        : {}),
      ...(input.ctaHref !== undefined ? { ctaHref: input.ctaHref.trim() || "/shop" } : {}),
      ...(input.headerStripEnabled !== undefined
        ? { headerStripEnabled: input.headerStripEnabled }
        : {}),
      ...(input.headerStripMode !== undefined ? { headerStripMode: input.headerStripMode } : {}),
      ...(input.headerStripImageUrl !== undefined
        ? {
            headerStripImageUrl:
              input.headerStripImageUrl === null
                ? null
                : input.headerStripImageUrl.trim() || null,
          }
        : {}),
      ...(input.headerStripBadge !== undefined
        ? { headerStripBadge: input.headerStripBadge.trim() }
        : {}),
      ...(input.headerStripTitle !== undefined
        ? { headerStripTitle: input.headerStripTitle.trim() }
        : {}),
      ...(input.headerStripSubtitle !== undefined
        ? { headerStripSubtitle: input.headerStripSubtitle.trim() }
        : {}),
      ...(input.headerStripCtaLabel !== undefined
        ? {
            headerStripCtaLabel:
              input.headerStripCtaLabel === null
                ? null
                : input.headerStripCtaLabel.trim() || null,
          }
        : {}),
      ...(input.headerStripCtaHref !== undefined
        ? { headerStripCtaHref: input.headerStripCtaHref.trim() || "/shop" }
        : {}),
    },
  });
  return mapHomeBanner(row);
}
