/** بنر اسلایدر صفحهٔ اصلی — فقط Tailwind */

export const homeBannerSliderSection =
  "home-banner-section relative w-full max-w-none bg-[#f7f4ef]";

/** ارتفاع ثابت: موبایل کوچک‌تر، از md تا lg ۳۰۰px، از xl (۱۲۸۰px) ۴۰۰px */
export const homeBannerSliderTrack =
  "relative h-[11.25rem] w-full sm:h-[13rem] md:h-[300px] xl:h-[400px]";

/** زنجیرهٔ ارتفاع Swiper داخل track ثابت */
export const homeBannerSliderSwiperHeight =
  "[&>div]:h-full [&>div>div]:h-full [&_.swiper]:h-full [&_.swiper-wrapper]:h-full [&_.swiper-slide]:h-full";

export const homeBannerSliderNavGroup =
  "absolute bottom-10 right-3 z-20 flex items-center md:bottom-12 md:right-5";

export const homeBannerSliderNavArrow =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-ivory shadow-md transition-[background-color,color,opacity] hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/35 disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:w-11";

export const homeBannerSliderNavArrowNext = "ml-1 mr-2 sm:mr-4";

export const homeBannerSliderNavArrowPrev = "mr-1";

export const homeBannerSliderNavIcon = "h-6 w-6";

export const homeBannerSliderPagination =
  "swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal !bottom-4 !left-0 !right-0 !w-full !transform-none z-30 flex justify-center md:!bottom-5";

export const homeBannerSliderPaginationBullet =
  "!inline-block !rounded-full !mx-1 !h-2 !w-2 !bg-stone-900/35 !transition-all !duration-300";

export const homeBannerSliderPaginationBulletActive =
  "!w-6 !bg-white [background-color:#fff!important] [opacity:1!important]";
