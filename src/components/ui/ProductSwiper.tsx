"use client";

import { type ReactNode } from "react";
import { Manipulation } from "swiper/modules";
import { SwiperSlide } from "swiper/react";
import { RtlSwiper, type RtlSwiperProps } from "@/components/ui/RtlSwiper";
import {
  productRailBreakpoints,
  productRailSwiper,
  productRailWrap,
} from "@/lib/styles/product-rail-swiper";

export interface ProductSwiperProps extends Omit<RtlSwiperProps, "navPlacement"> {
  children: ReactNode;
}

/** ریل محصول: چند کارت در نما (تا ۶)، fraction بر اساس صفحه، ناوبری کناری */
export function ProductSwiper({
  children,
  className,
  wrapperClassName,
  slidesPerView = 1.15,
  spaceBetween = 12,
  slidesPerGroup = 1,
  breakpoints = productRailBreakpoints,
  speed = 520,
  paginationType = "fraction",
  ...props
}: ProductSwiperProps) {
  return (
    <RtlSwiper
      navPlacement="product-rail"
      extraModules={[Manipulation]}
      wrapperClassName={wrapperClassName ?? productRailWrap}
      className={className ?? productRailSwiper}
      slidesPerView={slidesPerView}
      slidesPerGroup={slidesPerGroup}
      spaceBetween={spaceBetween}
      breakpoints={breakpoints}
      speed={speed}
      watchOverflow
      observer
      observeParents
      resizeObserver
      grabCursor
      showNav
      showPagination
      disableNavAtEnds
      paginationType={paginationType}
      {...props}
    >
      {children}
    </RtlSwiper>
  );
}
