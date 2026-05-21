"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProductSwiper } from "@/components/ui/ProductSwiper";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { cn } from "@/lib/utils";
import { productRailSlide, productRailSlideInner } from "@/lib/styles/product-rail-swiper";
import { SwiperSlide } from "swiper/react";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

export function HomeFeaturedProductRail() {
  const { featuredRail: rail, isLoading } = useHomeDataContext();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isLoading && rail.length === 0) return null;

  return (
    <section
      className="heritage-section-alt overflow-hidden"
      dir="rtl"
      aria-roledescription="carousel"
      aria-label={fa.home.railTitle}
    >
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.railEyebrow}
          title={fa.home.railTitle}
          subtitle={fa.home.railSubtitle}
          className="!mb-6 md:!mb-8 [&_.mt-8]:!mt-4"
        />

        {isLoading ? (
          <div className="shop-product-grid" aria-busy="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : rail.length > 1 ? (
          <ProductSwiper
            prevLabel={fa.home.railPrev}
            nextLabel={fa.home.railNext}
            paginationLabel={fa.home.railTitle}
            onSlideIndexChange={(i) => setActiveIndex(i)}
          >
            {rail.map((product, i) => (
              <SwiperSlide key={product.id} className={productRailSlide}>
                <div className={productRailSlideInner}>
                  <ProductCard product={product} index={i} />
                </div>
              </SwiperSlide>
            ))}
          </ProductSwiper>
        ) : (
          <div className="flex justify-center px-11 md:px-12">
            <div className={cn(productRailSlideInner, productRailSlide, "shrink-0")}>
              <ProductCard product={rail[0]} index={0} />
            </div>
          </div>
        )}

        {rail.length > 1 ? (
          <p className="sr-only" aria-live="polite">
            {fa.home.railSlideStatus(activeIndex + 1, rail.length)}
          </p>
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-4 text-center md:mt-6"
        >
          <Link href="/shop">
            <Button variant="outline">{fa.home.railViewShop}</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
