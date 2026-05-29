import type { HomeBannerDto } from "@/lib/types/home-content";

export function isHeaderStripVisible(banner: HomeBannerDto): boolean {
  if (!banner.headerStripEnabled) return false;
  if (banner.headerStripMode === "image") {
    return Boolean(banner.headerStripImageUrl?.trim());
  }
  return Boolean(
    banner.headerStripTitle.trim() ||
      banner.headerStripBadge.trim() ||
      banner.headerStripSubtitle.trim()
  );
}
