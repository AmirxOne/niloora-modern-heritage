/** استایل‌های اسلایدر محصول — فقط Tailwind (بدون globals.css) */

export const productRailWrap = "product-rail-wrap relative overflow-visible px-12 md:px-14";

export const productRailViewport = "product-rail-viewport relative w-full min-w-0 overflow-hidden px-1 sm:px-0";

export const productRailTrack = "relative isolate w-full min-w-0";

export const productRailSwiper =
  "product-rail-swiper w-full max-w-full overflow-hidden [&_.swiper-button-next]:!hidden [&_.swiper-button-prev]:!hidden [&_.swiper-slide]:box-border [&_.swiper-slide]:!h-auto [&_.swiper-slide]:h-auto [&_.swiper-wrapper]:!h-auto [&_.shop-product-card]:h-auto [&_.shop-product-card]:max-w-full [&_.artisan-card]:max-w-full";

export const productRailSlide = "swiper-slide !h-auto shrink-0";

export const productRailSlideInner =
  "w-full min-w-0 px-0.5 [&_.shop-product-card]:h-auto [&_.shop-product-card]:w-full";

export const productRailNavBtn =
  "product-rail-nav-btn pointer-events-auto absolute top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 bg-white text-ivory shadow-[0_2px_12px_rgba(44,42,41,0.14)] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:border-gold/45 hover:bg-parchment hover:shadow-[0_4px_16px_rgba(44,42,41,0.18)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-matte md:h-12 md:w-12";

export const productRailNavIcon =
  "h-5 w-5 shrink-0 stroke-[2.25] md:h-[1.35rem] md:w-[1.35rem]";

export const productRailNavLeft = "left-[-1.125rem] right-auto md:left-[-1.75rem]";

export const productRailNavRight = "right-[-1.125rem] left-auto md:right-[-1.75rem]";

export const productRailPagination =
  "swiper-pagination order-2 !static mt-4 flex w-full justify-center gap-2";

export const productRailPaginationFraction =
  "swiper-pagination-fraction order-2 !static mt-2 w-full py-2 text-center text-sm font-medium tabular-nums text-silver [&_.swiper-pagination-current]:text-ivory";

/** تا ۶ کارت در دسکتاپ؛ هر کلیک یک «صفحه» هم‌اندازهٔ نما */
export const productRailBreakpoints = {
  0: { slidesPerView: 1.15, slidesPerGroup: 1, spaceBetween: 12 },
  480: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 12 },
  640: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 14 },
  1024: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 14 },
  1280: { slidesPerView: 5, slidesPerGroup: 5, spaceBetween: 16 },
  1536: { slidesPerView: 6, slidesPerGroup: 6, spaceBetween: 16 },
} as const;

/** پرفروش‌ترین — تا ۵ کارت در نما؛ هر کلیک یک کارت */
export const productBestsellerBreakpoints = {
  0: { slidesPerView: 1.15, slidesPerGroup: 1, spaceBetween: 10 },
  480: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 10 },
  640: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 12 },
  1024: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 12 },
  1280: { slidesPerView: 5, slidesPerGroup: 1, spaceBetween: 14 },
} as const;
