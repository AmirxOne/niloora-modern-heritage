"use client";

import { useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductSwiper } from "@/components/ui/ProductSwiper";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { cn } from "@/lib/utils";
import { SwiperSlide } from "swiper/react";
import {
  productBestsellerBreakpoints,
  productRailSlide,
  productRailSlideInner,
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
          eyebrow={fa.home.bestsellersEyebrow}
          title={fa.home.bestsellersTitle}
          subtitle={fa.home.bestsellersSubtitle}
          className="!mb-6 md:!mb-8 [&_.mt-5]:!mt-4"
        />

        {isLoading ? (
          <div className="shop-product-grid" aria-busy="true">
            {Array.from({ length: 5 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
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
            disableNavAtEnds={false}
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
