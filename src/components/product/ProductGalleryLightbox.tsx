"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface ProductGalleryLightboxProps {
  images: string[];
  name: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Full-screen zoomable image viewer. Click/tap toggles a 2x zoom centred on the
 * pointer; Esc or the backdrop closes it. Kept dependency-free (CSS transforms
 * only) so it adds no bundle weight.
 */
export function ProductGalleryLightbox({
  images,
  name,
  index,
  onIndexChange,
  onClose,
}: ProductGalleryLightboxProps) {
  const total = images.length;
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const go = useCallback(
    (dir: -1 | 1) => {
      if (total <= 0) return;
      setZoomed(false);
      onIndexChange(((index + dir) % total + total) % total);
    },
    [index, onIndexChange, total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(-1);
      if (e.key === "ArrowLeft") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  const toggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setZoomed((value) => !value);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label={fa.product.galleryZoomClose}
        onClick={onClose}
      >
        <X size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
      </button>

      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-5xl items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-full w-full cursor-zoom-in select-none"
          onClick={toggleZoom}
          style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
        >
          <Image
            src={images[index]}
            alt={name}
            fill
            className="object-contain transition-transform duration-300 ease-out"
            sizes="100vw"
            style={{
              transform: zoomed ? "scale(2)" : "scale(1)",
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
            priority
          />
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={fa.product.galleryPrev}
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <ChevronRight size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
            </button>
            <button
              type="button"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={fa.product.galleryNext}
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <ChevronLeft size={iconSizes.lg} variant={ICON_VARIANT} aria-hidden />
            </button>
            <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {fa.product.galleryCounter(index + 1, total)}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
