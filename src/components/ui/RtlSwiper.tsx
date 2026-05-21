"use client";

import { type ReactNode, useMemo, useRef } from "react";
import { Swiper, type SwiperProps } from "swiper/react";
import { A11y, Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { useSwiperRtlControls } from "@/components/swiper/useSwiperRtlControls";
import {
  homeBannerSliderNav,
  homeBannerSliderNavIcon,
  homeBannerSliderNavNext,
  homeBannerSliderNavPrev,
} from "@/lib/styles/home-banner-swiper";
import {
  productRailNavBtn,
  productRailNavIcon,
  productRailNavLeft,
  productRailNavRight,
  productRailPagination,
  productRailPaginationFraction,
  productRailTrack,
  productRailViewport,
} from "@/lib/styles/product-rail-swiper";
import { ICON_VARIANT } from "@/lib/icons";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export type RtlSwiperNavPlacement = "product-rail" | "banner";

export interface RtlSwiperProps extends Omit<SwiperProps, "dir" | "modules" | "navigation" | "pagination"> {
  children?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  contentClassName?: string;
  showNav?: boolean;
  showPagination?: boolean;
  navPlacement?: RtlSwiperNavPlacement;
  prevLabel?: string;
  nextLabel?: string;
  paginationLabel?: string;
  paginationType?: "bullets" | "fraction";
  bulletClass?: string;
  bulletActiveClass?: string;
  paginationClassName?: string;
  navIconSize?: "sm" | "md";
  disableNavAtEnds?: boolean;
  extraModules?: SwiperProps["modules"];
  onSlideIndexChange?: (index: number, swiper: SwiperType) => void;
}

function useDocumentRtl() {
  return useMemo(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.dir === "rtl";
  }, []);
}

export function RtlSwiper({
  children,
  className,
  wrapperClassName,
  contentClassName,
  showNav = true,
  showPagination = false,
  navPlacement = "product-rail",
  prevLabel = "قبلی",
  nextLabel = "بعدی",
  paginationLabel = "اسلایدها",
  paginationType = "bullets",
  bulletClass,
  bulletActiveClass,
  paginationClassName,
  navIconSize = "sm",
  disableNavAtEnds = false,
  extraModules = [],
  onSlideIndexChange,
  onBeforeInit,
  onSwiper,
  onSlideChange,
  a11y: a11yProp,
  ...swiperProps
}: RtlSwiperProps) {
  const isRtl = useDocumentRtl();
  const isRail = navPlacement === "product-rail";
  const {
    prevRef,
    nextRef,
    paginationRef,
    canPrev,
    canNext,
    onBeforeInit: wireBeforeInit,
    onSwiper: wireSwiper,
    syncNavState,
    wireControls,
  } = useSwiperRtlControls(showPagination);
  const swiperRef = useRef<SwiperType | null>(null);

  const railIconClass =
    navIconSize === "md" ? productRailNavIcon : "h-5 w-5 shrink-0 stroke-[2.25]";
  const useFraction = paginationType === "fraction";

  const modules = useMemo(
    () => [Navigation, Pagination, A11y, ...(extraModules ?? [])],
    [extraModules]
  );

  const navButtons =
    showNav ? (
      isRail ? (
        <>
          <button
            ref={prevRef}
            type="button"
            className={cn(productRailNavBtn, productRailNavLeft)}
            aria-label={prevLabel}
            disabled={disableNavAtEnds && !canPrev}
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className={railIconClass} variant={ICON_VARIANT} aria-hidden />
          </button>
          <button
            ref={nextRef}
            type="button"
            className={cn(productRailNavBtn, productRailNavRight)}
            aria-label={nextLabel}
            disabled={disableNavAtEnds && !canNext}
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className={railIconClass} variant={ICON_VARIANT} aria-hidden />
          </button>
        </>
      ) : (
        <>
          <button
            ref={prevRef}
            type="button"
            className={cn(homeBannerSliderNav, homeBannerSliderNavPrev)}
            aria-label={prevLabel}
            disabled={disableNavAtEnds && !canPrev}
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className={homeBannerSliderNavIcon} variant={ICON_VARIANT} aria-hidden />
          </button>
          <button
            ref={nextRef}
            type="button"
            className={cn(homeBannerSliderNav, homeBannerSliderNavNext)}
            aria-label={nextLabel}
            disabled={disableNavAtEnds && !canNext}
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className={homeBannerSliderNavIcon} variant={ICON_VARIANT} aria-hidden />
          </button>
        </>
      )
    ) : null;

  const swiperEl = (
    <Swiper
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(className, "order-1 min-w-0")}
      modules={modules}
      navigation={false}
      pagination={
        showPagination
          ? useFraction
            ? {
                type: "custom",
                renderCustom: (swiper) => {
                  const page = (swiper.snapIndex + 1).toLocaleString("fa-IR");
                  const pages = swiper.snapGrid.length.toLocaleString("fa-IR");
                  return `<span class="swiper-pagination-current">${page}</span> / <span class="swiper-pagination-total">${pages}</span>`;
                },
              }
            : {
                clickable: true,
                dynamicBullets: false,
                ...(bulletClass ? { bulletClass } : {}),
                ...(bulletActiveClass ? { bulletActiveClass } : {}),
              }
          : false
      }
      onBeforeInit={(swiper) => {
        wireBeforeInit(swiper);
        onBeforeInit?.(swiper);
      }}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        wireSwiper(swiper);
        onSwiper?.(swiper);
      }}
      onAfterInit={(swiper) => {
        wireControls(swiper);
      }}
      onSlideChange={(swiper) => {
        onSlideIndexChange?.(swiper.realIndex, swiper);
        syncNavState(swiper);
        onSlideChange?.(swiper);
      }}
      onReachBeginning={(swiper) => syncNavState(swiper)}
      onReachEnd={(swiper) => syncNavState(swiper)}
      onResize={(swiper) => wireControls(swiper)}
      a11y={{
        prevSlideMessage: prevLabel,
        nextSlideMessage: nextLabel,
        ...(a11yProp && typeof a11yProp === "object" ? a11yProp : {}),
      }}
      {...swiperProps}
    >
      {children}
    </Swiper>
  );

  return (
    <div className={cn("relative", wrapperClassName)}>
      <div className={cn("flex min-w-0 flex-col", contentClassName)}>
        <div className={isRail ? productRailTrack : "relative min-w-0"}>
          {navButtons}
          {isRail ? <div className={productRailViewport}>{swiperEl}</div> : swiperEl}
        </div>
        {showPagination ? (
          <div
            ref={paginationRef}
            className={cn(
              isRail && useFraction
                ? productRailPaginationFraction
                : isRail
                  ? productRailPagination
                  : "swiper-pagination",
              paginationClassName,
              "order-2"
            )}
            role={useFraction ? "status" : "tablist"}
            aria-label={paginationLabel}
            aria-live={useFraction ? "polite" : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
