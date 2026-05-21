/** استایل‌های اسلایدر محصول — فقط Tailwind (بدون globals.css) */

export const productRailWrap = "relative overflow-visible px-12 md:px-14";

export const productRailViewport = "relative w-full min-w-0 px-1 sm:px-0";

export const productRailTrack = "relative isolate w-full min-w-0";

export const productRailSwiper =
  "w-full max-w-full overflow-hidden [&_.swiper-button-next]:!hidden [&_.swiper-button-prev]:!hidden [&_.swiper-slide]:box-border [&_.swiper-slide]:!h-auto [&_.swiper-slide]:h-auto [&_.swiper-wrapper]:!h-auto [&_.shop-product-card]:h-auto [&_.shop-product-card]:max-w-full";

export const productRailSlide = "swiper-slide !h-auto shrink-0";

export const productRailSlideInner =
  "w-full min-w-0 px-0.5 [&_.shop-product-card]:h-auto [&_.shop-product-card]:w-full";

export const productRailNavBtn =
  "pointer-events-auto absolute top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-stone-950 text-white shadow-[0_2px_14px_rgba(12,10,8,0.28)] backdrop-blur-[2px] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 hover:border-white/55 hover:bg-stone-900 hover:shadow-[0_4px_18px_rgba(12,10,8,0.35)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-matte disabled:cursor-not-allowed disabled:opacity-40 md:h-12 md:w-12";

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

/** پرفروش‌ترین — تا ۴ کارت در نما؛ هر کلیک یک کارت */
export const productBestsellerBreakpoints = {
  0: { slidesPerView: 1.15, slidesPerGroup: 1, spaceBetween: 12 },
  480: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 12 },
  768: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 14 },
} as const;
