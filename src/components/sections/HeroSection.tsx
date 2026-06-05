"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
    <section className="home-hero" aria-label={fa.home.heroGlamourTitle1}>
      <div className="home-hero-layout">
        <div className="home-hero-inner" dir="rtl">
          <div className="home-hero-copy">
            <h1 className="home-hero-heading">
              <span className="home-hero-heading-line">{fa.home.heroGlamourTitle1}</span>
              <span className="home-hero-heading-line home-hero-heading-line--accent">
                {fa.home.heroGlamourTitle2}
              </span>
            </h1>

            <p className="home-hero-lead">{fa.home.heroShowcaseLead}</p>

            <div className="home-hero-cta-row">
              <Link href={ctaPrimaryHref} className="home-hero-cta-link">
                <Button
                  size="md"
                  className="w-full min-w-[8.5rem] shadow-luxury-gold sm:w-auto"
                  onClick={() => trackCtaConversion("primary")}
                >
                  {ctaPrimaryLabel}
                </Button>
              </Link>
              <Link href="/about" className="home-hero-cta-link">
                <Button
                  variant="secondary"
                  size="md"
                  className="home-hero-cta-video w-full sm:w-auto"
                  onClick={() => trackCtaConversion("secondary")}
                >
                  <span className="home-hero-play-icon" aria-hidden />
                  {fa.home.heroWatchVideo}
                </Button>
              </Link>
            </div>

            <div className="home-hero-trust">
              <span className="home-hero-trust-icon" aria-hidden>
                <BadgeCheck size={iconSizes.lg} variant={ICON_VARIANT} />
              </span>
              <div className="home-hero-trust-text">
                <p className="home-hero-trust-title">{fa.home.heroTrustCertTitle}</p>
                <p className="home-hero-trust-desc">{fa.home.heroTrustCertDesc}</p>
              </div>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-feature" aria-hidden={!activeSlide}>
              {activeSlide ? (
                <Link href={slideHref(activeSlide.id)} className="home-hero-feature-link">
                  <Image
                    key={activeSlide.id}
                    src={activeSlide.image}
                    alt={activeSlide.name}
                    fill
                    className="home-hero-feature-image"
                    priority
                    sizes="(max-width: 1024px) 55vw, 420px"
                  />
                </Link>
              ) : null}
            </div>

            <div
              className="home-hero-rail"
              aria-roledescription="carousel"
              aria-label={fa.home.heroShowcaseTitle}
            >
            {slideCount > 1 ? (
              <button
                type="button"
                className={cn("home-hero-rail-nav", navState.isBeginning && "home-hero-rail-nav--dimmed")}
                aria-label={fa.home.heroGalleryUp}
                disabled={navState.isBeginning}
                onClick={() => go(-1)}
              >
                <ChevronDown className="home-hero-rail-nav-icon rotate-180" variant={ICON_VARIANT} aria-hidden />
              </button>
            ) : null}

            <div className="home-hero-rail-viewport">
              <Swiper
                modules={[A11y]}
                direction="vertical"
                slidesPerView={3}
                spaceBetween={14}
                slideToClickedSlide
                watchSlidesProgress
                className="home-hero-rail-swiper"
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
                  <SwiperSlide key={item.id} className="home-hero-rail-slide">
                    <Link
                      href={slideHref(item.id)}
                      className={cn(
                        "home-hero-rail-card",
                        index === activeIndex && "home-hero-rail-card--active"
                      )}
                      aria-label={item.name}
                      aria-current={index === activeIndex ? "true" : undefined}
                    >
                      <span className="home-hero-rail-card-media">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </span>
                      <span className="home-hero-rail-card-label">{item.name}</span>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {slideCount > 1 ? (
              <button
                type="button"
                className={cn("home-hero-rail-nav", navState.isEnd && "home-hero-rail-nav--dimmed")}
                aria-label={fa.home.heroGalleryDown}
                disabled={navState.isEnd}
                onClick={() => go(1)}
              >
                <ChevronDown className="home-hero-rail-nav-icon" variant={ICON_VARIANT} aria-hidden />
              </button>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
