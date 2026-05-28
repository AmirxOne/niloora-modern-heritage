/** مسیر پیش‌فرض نماد برند (فایل در public/brand-mark.png) */
export const BRAND_MARK_PATH = "/brand-mark.png";

/** بزرگ‌نمایی داخل قاب — فایل PNG حاشیه/پس‌زمینه زیاد دارد */
export const BRAND_MARK_VISUAL_ZOOM = 1.35;

export const brandMarkSizes = {
  headerMobile: 39,
  headerDesktop: 45,
  footer: 41,
  footerProminent: 45,
} as const;

export function resolveBrandLogoUrl(logoUrl: string | null | undefined): string {
  const trimmed = logoUrl?.trim();
  return trimmed || BRAND_MARK_PATH;
}
