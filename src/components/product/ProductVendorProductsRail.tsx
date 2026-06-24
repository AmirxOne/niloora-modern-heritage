"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { ProductSwiper } from "@/components/ui/ProductSwiper";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import { productRailSlide, productRailSlideInner } from "@/lib/styles/product-rail-swiper";
import { SwiperSlide } from "swiper/react";

type Props = {
  products: Product[];
  vendorName?: string | null;
  className?: string;
};

export function ProductVendorProductsRail({ products, vendorName, className }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (products.length === 0) return null;

  const title = vendorName
    ? fa.product.moreFromVendorNamed(vendorName)
    : fa.product.moreFromVendor;

  return (
    <section
      className={cn("product-detail-vendor-rail", className)}
      dir="rtl"
      aria-roledescription="carousel"
      aria-label={title}
    >
      <h2 className="product-detail-related-title">{title}</h2>

      {products.length > 1 ? (
        <ProductSwiper
          prevLabel={fa.home.railPrev}
          nextLabel={fa.home.railNext}
          paginationLabel={title}
          onSlideIndexChange={(i) => setActiveIndex(i)}
        >
          {products.map((product, i) => (
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
            <ProductCard product={products[0]} index={0} />
          </div>
        </div>
      )}

      {products.length > 1 ? (
        <p className="sr-only" aria-live="polite">
          {fa.home.railSlideStatus(activeIndex + 1, products.length)}
        </p>
      ) : null}
    </section>
  );
}
