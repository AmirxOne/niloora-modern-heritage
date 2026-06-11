"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ProductQuickActions } from "@/components/commerce/ProductQuickActions";
import { fa } from "@/lib/i18n/fa";
import { ProductPriceDisplay } from "@/components/product/ProductPriceDisplay";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { ProductContentBrief } from "@/components/product/ProductContentBrief";
import { getProductListingPreview } from "@/lib/product-listing";
import {
  homeBannerSliderNav,
  homeBannerSliderNavIcon,
  homeBannerSliderNavNext,
  homeBannerSliderNavPrev,
  homeBannerSliderSection,
} from "@/lib/styles/home-banner-swiper";
import { displayDigits } from "@/lib/persian-digits";
import { cn } from "@/lib/utils";
import { ICON_VARIANT } from "@/lib/icons";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import { BLUR_DATA_URL } from "@/lib/image-blur";

const INTERVAL_MS = 6200;

export function HomeProductBannerSlider() {
  const { sliders: slides, isLoading } = useHomeDataContext();
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const active = slides[index] ?? slides[0];

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => {
        const len = slides.length;
        if (len === 0) return 0;
        return (i + dir + len) % len;
      });
    },
    [slides.length]
  );

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [go, reduceMotion, slides.length]);

  if (isLoading) {
    return (
      <section className={homeBannerSliderSection} aria-busy="true">
        <div className="site-container pb-3 pt-1 md:pb-5 md:pt-3">
          <div className="sk relative overflow-hidden rounded-heritage aspect-[4/3] min-h-[220px] md:aspect-[21/9] md:min-h-[260px] lg:min-h-[300px]">
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-12">
              <div className="max-w-xl flex-1 space-y-3">
                <div className="sk h-6 w-24 rounded-full" />
                <div className="sk h-4 w-48" />
                <div className="sk h-10 w-72 max-w-full" />
                <div className="sk h-4 w-64 max-w-full" />
                <div className="sk h-4 w-56 max-w-full" />
                <div className="sk mt-2 h-6 w-32" />
              </div>
              <div className="mt-6 w-full max-w-[15rem] space-y-3 lg:mt-0">
                <div className="sk h-11 w-full rounded-heritage" />
                <div className="sk h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!active) return null;

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      className={homeBannerSliderSection}
      role="region"
      aria-roledescription="carousel"
      aria-label={fa.home.bannerEyebrow}
    >
      <div className="site-container pb-3 pt-1 md:pb-5 md:pt-3">
        <header className="mb-3 text-center md:mb-4">
          <p className="heritage-eyebrow mx-auto">{fa.home.bannerEyebrow}</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-ivory md:text-2xl lg:text-[1.65rem]">
            {fa.home.bannerTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-silver md:text-sm">
            {fa.home.bannerSubtitle}
          </p>
        </header>

        <div className="relative overflow-hidden rounded-heritage border border-gold/15 shadow-luxury">
          <div className="relative aspect-[4/3] min-h-[220px] md:aspect-[21/9] md:min-h-[260px] lg:min-h-[300px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                role="group"
                aria-roledescription="slide"
                aria-label={fa.home.bannerSlideStatus(index + 1, slides.length)}
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                transition={transition}
                className="absolute inset-0 min-h-0 overflow-hidden"
              >
                <Image
                  src={active.image}
                  alt={active.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, min(1639px, 92vw)"
                  priority={index === 0}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                {/* موبایل: تیره از پایین | دسکتاپ: تیره از لبهٔ راست (جایی که در RTL متن اصلی می‌نشیند) */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-stone-950/92 via-stone-900/50 to-stone-800/15 md:bg-gradient-to-l md:from-stone-950/90 md:via-stone-900/45 md:to-stone-800/5"
                  aria-hidden
                />

                <div
                  className={cn(
                    "absolute inset-0 flex flex-col justify-end overflow-hidden p-5 md:gap-6 md:p-7 lg:flex-row lg:items-end lg:justify-between lg:p-9",
                    slides.length > 1 ? "pb-10 md:pb-14" : ""
                  )}
                >
                  <div className="min-w-0 max-w-xl flex-1 md:pb-0 lg:pb-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <ProductAvailabilityBadge availability={active.availability} short />
                      {active.featured ? (
                        <span className="rounded-full border border-gold/35 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold-dark">
                          {fa.shop.featured}
                        </span>
                      ) : null}
                      {active.bestseller ? (
                        <span className="rounded-full border border-turquoise/30 bg-turquoise/10 px-2.5 py-0.5 text-[10px] font-semibold text-turquoise-dark">
                          {fa.shop.bestseller}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium tracking-wide text-gold-light/90">
                      {active.collection ?? active.namePersian}
                    </p>
                    <h3
                      className="mt-1 font-display text-xl font-semibold leading-tight text-white md:text-2xl lg:text-[1.65rem]"
                      data-persian-digits="react"
                    >
                      {displayDigits(active.name)}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-parchment/90 md:line-clamp-3 lg:hidden">
                      {getProductListingPreview(active, 2)}
                    </p>
                    <ProductContentBrief
                      listing={active.listing}
                      compact
                      className="mt-3 hidden text-parchment/95 lg:block"
                    />
                    <div className="mt-5">
                      <ProductPriceDisplay product={active} size="lg" showBadge />
                    </div>
                  </div>

                  <div className="mt-6 flex w-full min-w-0 max-w-full shrink-0 flex-col gap-3 sm:mx-auto sm:max-w-[14rem] md:mt-0 md:shrink-0 md:items-stretch lg:mx-0 lg:max-w-[15rem] lg:items-stretch">
                    <ProductQuickActions
                      product={active}
                      navigateToCart={false}
                      onDark
                      className="w-full max-w-full"
                    />
                    <Link
                      href="/shop"
                      className="text-center text-xs font-medium text-gold-light underline-offset-4 hover:text-white hover:underline lg:text-end"
                    >
                      {fa.home.exploreCollection}
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  className={cn(homeBannerSliderNav, homeBannerSliderNavPrev)}
                  aria-label={fa.home.bannerPrev}
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className={homeBannerSliderNavIcon} variant={ICON_VARIANT} aria-hidden />
                </button>
                <button
                  type="button"
                  className={cn(homeBannerSliderNav, homeBannerSliderNavNext)}
                  aria-label={fa.home.bannerNext}
                  onClick={() => go(1)}
                >
                  <ChevronRight className={homeBannerSliderNavIcon} variant={ICON_VARIANT} aria-hidden />
                </button>

                <div
                  className="absolute bottom-4 inset-x-0 z-10 flex justify-center gap-2 md:bottom-6"
                  role="tablist"
                  aria-label={fa.home.bannerEyebrow}
                >
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={fa.home.bannerGoToSlide(i + 1)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light/60",
                        i === index
                          ? "w-8 bg-gold"
                          : "w-2 bg-white/35 hover:bg-white/55"
                      )}
                      onClick={() => setIndex(i)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {fa.home.bannerSlideStatus(index + 1, slides.length)} — {displayDigits(active.name)}
        </p>
      </div>
    </section>
  );
}
