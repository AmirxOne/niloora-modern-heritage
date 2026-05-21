"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ProductMediaActions } from "@/components/product/ProductMediaActions";

interface ProductGalleryProps {
  images: string[];
  name: string;
  productId: string;
}

export function ProductGallery({ images, name, productId }: ProductGalleryProps) {
  const slides = images.length > 0 ? images : [images[0]];
  const [activeIndex, setActiveIndex] = useState(0);
  const total = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (total <= 0) return;
      setActiveIndex(((index % total) + total) % total);
    },
    [total]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goPrev();
      if (e.key === "ArrowLeft") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <div className="product-gallery" aria-roledescription="carousel">
      <div className="product-gallery-stage">
        <div className="product-gallery-frame">
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={cn(
                "product-gallery-slide",
                i === activeIndex && "product-gallery-slide--active"
              )}
              aria-hidden={i !== activeIndex}
            >
              <Image
                src={src}
                alt={i === activeIndex ? name : ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
              />
            </div>
          ))}

          <ProductMediaActions productId={productId} productName={name} />

          {total > 1 ? (
            <>
              <button
                type="button"
                className="product-gallery-nav product-gallery-nav--prev"
                onClick={goPrev}
                aria-label={fa.product.galleryPrev}
              >
                <ChevronRight size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
              </button>
              <button
                type="button"
                className="product-gallery-nav product-gallery-nav--next"
                onClick={goNext}
                aria-label={fa.product.galleryNext}
              >
                <ChevronLeft size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
              </button>
              <p className="product-gallery-counter" aria-live="polite">
                {fa.product.galleryCounter(activeIndex + 1, total)}
              </p>
            </>
          ) : null}
        </div>

        {total > 1 ? (
          <div className="product-gallery-dots" role="tablist" aria-label={fa.product.galleryDotsAria}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={fa.product.galleryDot(i + 1, total)}
                className={cn("product-gallery-dot", i === activeIndex && "product-gallery-dot--active")}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="product-gallery-thumbs" aria-label={fa.product.galleryThumbsAria}>
          {slides.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              type="button"
              className={cn(
                "product-gallery-thumb",
                i === activeIndex && "product-gallery-thumb--active"
              )}
              onClick={() => goTo(i)}
              aria-label={fa.product.galleryDot(i + 1, total)}
              aria-current={i === activeIndex}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
