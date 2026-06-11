"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { BadgeCheck, ChevronDown } from "@/components/icons";
import { SITE_IMAGE_1, SITE_IMAGE_2 } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";
import { useAbExperiment } from "@/lib/hooks/useAbExperiment";
import { trackAbEvent } from "@/lib/ab/tracker";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import { Button } from "@/components/ui/Button";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { displayDigits } from "@/lib/persian-digits";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import "swiper/css";

type HeroSlide = {
  id: string;
  name: string;
  image: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  { id: "hero-fallback-1", name: fa.brand.name, image: SITE_IMAGE_1 },
  { id: "hero-fallback-2", name: fa.brand.name, image: SITE_IMAGE_2 },
  { id: "hero-fallback-3", name: fa.brand.name, image: SITE_IMAGE_1 },
  { id: "hero-fallback-4", name: fa.brand.name, image: SITE_IMAGE_2 },
  { id: "hero-fallback-5", name: fa.brand.name, image: SITE_IMAGE_2 },
];

const HERO_RAIL_VARS = {
  "--hero-rail-thumb": "5.25rem",
  "--hero-rail-card-inner-gap": "0.5rem",
  "--hero-rail-card-pad": "0.625rem",
  "--hero-rail-label-h": "1.125rem",
  "--hero-rail-card-gap": "0.875rem",
  "--hero-rail-card-h": "calc(0.625rem * 2 + 5.25rem + 0.5rem + 1.125rem)",
} as CSSProperties;

const heroRailNavClassName =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-white text-ivory-light transition-[color,border-color,opacity,transform] duration-200 hover:border-gold/45 hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/35 disabled:cursor-not-allowed disabled:border-gold/15 disabled:text-silver/70 disabled:opacity-75 disabled:hover:border-gold/15 disabled:hover:text-silver/70";

const heroRailNavDimmedClassName =
  "cursor-not-allowed border-gold/15 text-silver/70 opacity-75 hover:border-gold/15 hover:text-silver/70";

function toHeroSlides(products: Product[]): HeroSlide[] {
  return products.map((product) => ({
    id: product.id,
    name: product.namePersian?.trim() || product.name,
    image: product.image,
  }));
}

function slideHref(id: string) {
  return id.startsWith("hero-fallback-") ? "/shop" : `/product/${id}`;
}

export function HeroSection() {
  const { sliders, bestsellers } = useHomeDataContext();
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [navState, setNavState] = useState({ isBeginning: true, isEnd: false });
  const ctaExperiment = useAbExperiment("hero_cta_v1");

  const ctaPrimaryHref = ctaExperiment.variantId === "customize_first" ? "/customize" : "/shop";
  const ctaPrimaryLabel =
    ctaExperiment.variantId === "customize_first" ? fa.home.designRing : fa.home.heroExplore;

  const slides = useMemo(() => {
    const source = sliders.length > 0 ? sliders : bestsellers.length > 0 ? bestsellers : [];
    if (source.length === 0) return FALLBACK_SLIDES;
    return toHeroSlides(source).slice(0, 12);
  }, [sliders, bestsellers]);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const slideCount = slides.length;

  const trackCtaConversion = (slot: "primary" | "secondary") => {
    void trackAbEvent({
      experimentId: ctaExperiment.experimentId,
      variantId: ctaExperiment.variantId,
      identity: ctaExperiment.identity,
      type: "conversion",
      page: "/",
      metadata: { slot },
    });
  };

  const syncNavState = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
    setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
  }, []);

  const go = useCallback((dir: -1 | 1) => {
    if (dir === -1) swiperRef.current?.slidePrev();
    else swiperRef.current?.slideNext();
  }, []);

  return (
    <section
      className="relative isolate w-full max-w-none overflow-hidden border-b border-[#ece8e2] bg-[#faf8f5]"
      aria-label={fa.home.heroGlamourTitle1}
    >
      <div className="relative z-10 mx-auto flex min-h-[clamp(520px,62vh,680px)] w-full max-w-site items-center px-5 py-10 md:px-8 md:py-12 lg:px-12 lg:py-14 xl:px-16">
        <div className="hero-showcase-shell">
          <div className="flex w-full max-w-none flex-col text-start lg:max-w-[30rem] lg:shrink-0">
            <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.08] text-ivory">
              <span className="block">{fa.home.heroGlamourTitle1}</span>
              <span className="block text-ivory">{fa.home.heroGlamourTitle2}</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-[1.85] text-silver md:mt-5 md:text-[0.9375rem]">
              {fa.home.heroShowcaseLead}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-8">
              <Link href={ctaPrimaryHref} className="inline-flex w-full sm:w-auto">
                <Button
                  size="md"
                  className="w-full min-w-[11rem] shadow-luxury-gold sm:w-auto"
                  onClick={() => trackCtaConversion("primary")}
                >
                  {ctaPrimaryLabel}
                </Button>
              </Link>
              <Link href="/about" className="inline-flex w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full gap-2.5 border-[#ebe6df] bg-[#f5f2ec] text-gold-dark hover:border-gold/35 hover:bg-[#f0ebe3] hover:text-gold-dark sm:w-auto"
                  onClick={() => trackCtaConversion("secondary")}
                >
                  <span
                    className="inline-block h-0 w-0 shrink-0 border-y-[5px] border-y-transparent border-s-[8px] border-s-current"
                    aria-hidden
                  />
                  {fa.home.heroWatchVideo}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-start gap-3 border-t border-gold/10 pt-6 md:mt-10">
              <span className="inline-flex shrink-0 text-gold" aria-hidden>
                <BadgeCheck size={iconSizes.lg} variant={ICON_VARIANT} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ivory">{fa.home.heroTrustCertTitle}</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-silver">
                  {fa.home.heroTrustCertDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="hero-showcase-visual">
            <div
              className="relative flex shrink-0 items-center justify-center lg:z-[2]"
              aria-hidden={!activeSlide}
            >
              {activeSlide ? (
                <Link
                  href={slideHref(activeSlide.id)}
                  className="relative block aspect-square w-[min(72vw,22rem)] shrink-0 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_20px_44px_-28px_rgba(44,42,41,0.18)] lg:w-[22rem]"
                >
                  <Image
                    key={activeSlide.id}
                    src={activeSlide.image}
                    alt={activeSlide.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 55vw, 420px"
                  />
                </Link>
              ) : null}
            </div>

            <div
              className="hero-showcase-rail flex flex-col items-center gap-3"
              style={HERO_RAIL_VARS}
              aria-roledescription="carousel"
              aria-label={fa.home.heroShowcaseTitle}
            >
              {slideCount > 1 ? (
                <button
                  type="button"
                  className={cn(
                    heroRailNavClassName,
                    navState.isBeginning && heroRailNavDimmedClassName
                  )}
                  aria-label={fa.home.heroGalleryUp}
                  disabled={navState.isBeginning}
                  onClick={() => go(-1)}
                >
                  <ChevronDown
                    className="h-4 w-4 rotate-180"
                    variant={ICON_VARIANT}
                    aria-hidden
                  />
                </button>
              ) : null}

              <div className="relative w-full overflow-hidden h-[calc(var(--hero-rail-card-h)*3+var(--hero-rail-card-gap)*2)]">
                <Swiper
                  modules={[A11y]}
                  direction="vertical"
                  slidesPerView={3}
                  spaceBetween={14}
                  slideToClickedSlide
                  watchSlidesProgress
                  observer={false}
                  observeParents={false}
                  className="hero-showcase-rail-swiper h-full w-full !overflow-hidden [&_.swiper-wrapper]:items-stretch"
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                    syncNavState(swiper);
                  }}
                  onSlideChange={syncNavState}
                  onReachBeginning={syncNavState}
                  onReachEnd={syncNavState}
                  onFromEdge={syncNavState}
                  onResize={syncNavState}
                >
                  {slides.map((item, index) => (
                    <SwiperSlide key={item.id} className="!h-[var(--hero-rail-card-h)]">
                      <Link
                        href={slideHref(item.id)}
                        className={cn(
                          "flex h-full w-full flex-col items-center gap-2 rounded-[1.1rem] border border-transparent bg-[#f5f2ec] p-2.5 transition-[border-color,box-shadow,transform] duration-200 hover:border-gold/25 hover:shadow-[0_8px_24px_-16px_rgba(184,134,11,0.35)]",
                          index === activeIndex &&
                            "border-gold/55 shadow-[0_10px_28px_-14px_rgba(184,134,11,0.4)]"
                        )}
                        aria-label={item.name}
                        aria-current={index === activeIndex ? "true" : undefined}
                      >
                        <span className="relative block aspect-square w-full max-w-[var(--hero-rail-thumb)] shrink-0 overflow-hidden rounded-[0.85rem] bg-white">
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="120px" />
                        </span>
                        <span className="line-clamp-1 w-full text-center text-[11px] font-medium text-ivory-light">
                          {displayDigits(item.name)}
                        </span>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {slideCount > 1 ? (
                <button
                  type="button"
                  className={cn(heroRailNavClassName, navState.isEnd && heroRailNavDimmedClassName)}
                  aria-label={fa.home.heroGalleryDown}
                  disabled={navState.isEnd}
                  onClick={() => go(1)}
                >
                  <ChevronDown className="h-4 w-4" variant={ICON_VARIANT} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
