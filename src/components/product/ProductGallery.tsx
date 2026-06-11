"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ProductMediaActions } from "@/components/product/ProductMediaActions";
import { ProductGalleryLightbox } from "@/components/product/ProductGalleryLightbox";
import { BLUR_DATA_URL } from "@/lib/image-blur";

interface ProductGalleryProps {
  images: string[];
  name: string;
  productId: string;
}

export function ProductGallery({ images, name, productId }: ProductGalleryProps) {
  const slides = images.length > 0 ? images : [images[0]];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
          {slides.map((src, i) => {
            // Only eagerly mount the first, the active, and its immediate
            // neighbours. Distant slides mount lazily once navigated to, so a
            // product with many photos no longer loads every image upfront.
            const shouldRender = i === 0 || Math.abs(i - activeIndex) <= 1;
            return (
              <div
                key={`${src}-${i}`}
                className={cn(
                  "product-gallery-slide",
                  i === activeIndex && "product-gallery-slide--active"
                )}
                aria-hidden={i !== activeIndex}
              >
                {shouldRender ? (
                  <button
                    type="button"
                    className="absolute inset-0 h-full w-full cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={fa.product.galleryZoomOpen}
                    tabIndex={i === activeIndex ? 0 : -1}
                  >
                    <Image
                      src={src}
                      alt={i === activeIndex ? name : ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={i === 0}
                      loading={i === 0 ? undefined : "lazy"}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  </button>
                ) : null}
              </div>
            );
          })}

          <button
            type="button"
            className="product-gallery-zoom absolute bottom-3 left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-stone-950/55 text-white transition hover:bg-stone-950/75"
            onClick={() => setLightboxOpen(true)}
            aria-label={fa.product.galleryZoomOpen}
            title={fa.product.galleryZoomHint}
          >
            <Search size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>

          <ProductMediaActions productId={productId} productName={name} />

          {total > 1 ? (
            <>
              <button
                type="button"
                className="product-gallery-nav product-gallery-nav--prev"
                onClick={goPrev}
                aria-label={fa.product.galleryPrev}
              >
                <ChevronLeft size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
              </button>
              <button
                type="button"
                className="product-gallery-nav product-gallery-nav--next"
                onClick={goNext}
                aria-label={fa.product.galleryNext}
              >
                <ChevronRight size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
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

      {lightboxOpen ? (
        <ProductGalleryLightbox
          images={slides}
          name={name}
          index={activeIndex}
          onIndexChange={goTo}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}
