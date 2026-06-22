"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductSwiper } from "@/components/ui/ProductSwiper";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { SwiperSlide } from "swiper/react";
import {
  productBestsellerBreakpoints,
  productRailSlide,
  productRailSlideInner,
  productRailWrap,
} from "@/lib/styles/product-rail-swiper";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

export function BestSellers() {
  const { bestsellers: products, isLoading } = useHomeDataContext();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      className="heritage-section-alt"
      dir="rtl"
      aria-roledescription="carousel"
      aria-label={fa.home.bestsellersTitle}
    >
      <div className="site-container">
        <SectionHeading
          title={fa.home.bestsellersTitle}
          subtitle={fa.home.bestsellersSubtitle}
          className="!mb-6 md:!mb-8 [&_.mt-5]:!mt-4"
        />

        {isLoading ? (
          <div className={`${productRailWrap} flex gap-3 overflow-hidden px-8 md:px-10`} aria-busy="true">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="sk h-72 min-w-[calc(100%/1.15)] shrink-0 rounded-heritage-lg sm:min-w-[calc((100%-12px)/2)] md:min-w-[calc((100%-28px)/3)] lg:min-w-[calc((100%-42px)/4)] xl:min-w-[calc((100%-64px)/5)]"
              />
            ))}
          </div>
        ) : products.length > 1 ? (
          <ProductSwiper
            breakpoints={productBestsellerBreakpoints}
            prevLabel={fa.home.bestsellersPrev}
            nextLabel={fa.home.bestsellersNext}
            navIconSize="md"
            showNav
            showPagination={false}
            onSlideIndexChange={(i) => setActiveIndex(i)}
          >
            {products.map((product, i) => (
              <SwiperSlide key={product.id} className={productRailSlide}>
                <div className={productRailSlideInner}>
                  <ProductCard
                    product={product}
                    index={i}
                    variant="carousel"
                    compact
                  />
                </div>
              </SwiperSlide>
            ))}
          </ProductSwiper>
        ) : (
          <div className="flex justify-center px-10 md:px-12">
            <div className={cn(productRailSlideInner, productRailSlide, "max-w-[280px] shrink-0")}>
              <ProductCard
                product={products[0]}
                index={0}
                variant="carousel"
                compact
              />
            </div>
          </div>
        )}

        {products.length > 1 ? (
          <p className="sr-only" aria-live="polite">
            {fa.home.bestsellersSlideStatus(activeIndex + 1, products.length)}
          </p>
        ) : null}

      </div>
    </section>
  );
}
