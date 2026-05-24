"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductSwiper } from "@/components/ui/ProductSwiper";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/shop/ProductCardSkeleton";
import { SwiperSlide } from "swiper/react";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import { productRailSlide, productRailSlideInner } from "@/lib/styles/product-rail-swiper";
import { Button } from "@/components/ui/Button";

export function HomePersonalizedRecommendations() {
  const { personalized, isLoading } = useHomeDataContext();

  if (!isLoading && personalized.length === 0) return null;

  return (
    <section className="heritage-section-alt" dir="rtl" aria-label={fa.home.personalized.title}>
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.personalized.eyebrow}
          title={fa.home.personalized.title}
          subtitle={fa.home.personalized.subtitle}
          className="!mb-6 md:!mb-8"
        />

        {isLoading ? (
          <div className="shop-product-grid" aria-busy="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : personalized.length > 1 ? (
          <ProductSwiper
            prevLabel={fa.home.personalized.prev}
            nextLabel={fa.home.personalized.next}
            paginationLabel={fa.home.personalized.title}
          >
            {personalized.map((product, i) => (
              <SwiperSlide key={product.id} className={productRailSlide}>
                <div className={productRailSlideInner}>
                  <ProductCard product={product} index={i} />
                </div>
              </SwiperSlide>
            ))}
          </ProductSwiper>
        ) : (
          <div className="shop-product-grid">
            <ProductCard product={personalized[0]} index={0} />
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-5 text-center md:mt-6">
          <Link href="/shop">
            <Button variant="outline">{fa.home.personalized.cta}</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
