/** مسیر پیش‌فرض نماد برند (cache-busted برای رفرش فوری لوگو) */
export const BRAND_MARK_PATH = "/brand-mark.png?v=20260603";

/** بزرگ‌نمایی داخل قاب — فایل PNG حاشیه/پس‌زمینه زیاد دارد */
export const BRAND_MARK_VISUAL_ZOOM = 1.25;

export const brandMarkSizes = {
  headerMobile: 39,
  headerDesktop: 45,
  footer: 41,
  footerProminent: 45,
} as const;

export function resolveBrandLogoUrl(logoUrl: string | null | undefined): string {
  const trimmed = logoUrl?.trim();
  if (!trimmed) return BRAND_MARK_PATH;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return BRAND_MARK_PATH;
}
