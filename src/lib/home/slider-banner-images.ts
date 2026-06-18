import type { Product } from "@/lib/types";

/** بنرهای اختصاصی در public — نام فایل: slider-banner-{productId}.png */
const SLIDER_BANNER_BASE = "/images/home/slider-banners";

export const HOME_SLIDER_BANNER_IMAGES: Record<string, string> = {
  "NL-RGM-0014": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0014.png`,
  "NL-RGM-0039": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0039.png`,
  "NL-RGM-0080": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0080.png`,
  "NL-RGM-0111": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0111.png`,
  "NL-RGM-0112": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0112.png`,
  "NL-RGM-0113": `${SLIDER_BANNER_BASE}/slider-banner-NL-RGM-0113.png`,
};

/** ترتیب پیش‌فرض وقتی اسلاید دستی در ادمین ثبت نشده باشد. */
export const HOME_SLIDER_BANNER_PRODUCT_IDS = [
  "NL-RGM-0112",
  "NL-RGM-0014",
  "NL-RGM-0039",
  "NL-RGM-0080",
  "NL-RGM-0111",
  "NL-RGM-0113",
] as const;

export function getCatalogSliderBannerUrl(productId: string): string | undefined {
  return HOME_SLIDER_BANNER_IMAGES[productId];
}

/** مسیر استاندارد بنر برای هر محصول (حتی اگر هنوز در کاتالوگ ثبت نشده باشد). */
export function getStandardSliderBannerPath(productId: string): string {
  return `${SLIDER_BANNER_BASE}/slider-banner-${productId}.png`;
}

/**
 * بنر اسلایدر: اول URL ادمین، بعد فایل slider-banners، در نهایت عکس محصول.
 */
export function resolveSliderBannerUrl(productId: string, adminBannerUrl?: string | null): string | undefined {
  const fromAdmin = adminBannerUrl?.trim();
  if (fromAdmin) return fromAdmin;
  return getCatalogSliderBannerUrl(productId);
}

export function resolveHomeSliderBannerImage(slide: Product): string {
  const fromSlide = slide.sliderBannerImageUrl?.trim();
  if (fromSlide) return fromSlide;
  const fromCatalog = getCatalogSliderBannerUrl(slide.id);
  if (fromCatalog) return fromCatalog;
  return slide.image;
}

/** PNGهای استاتیک public — بدون فشرده‌سازی next/image */
export function isStaticPublicSliderBanner(src: string): boolean {
  return src.startsWith(SLIDER_BANNER_BASE) && /\.png$/i.test(src);
}
