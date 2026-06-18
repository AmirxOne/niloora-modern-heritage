"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { useReducedMotion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import {
  homeBannerSliderSection,
  homeBannerSliderTrack,
  homeBannerSliderSwiperHeight,
  homeBannerSliderPaginationBullet,
  homeBannerSliderPaginationBulletActive,
} from "@/lib/styles/home-banner-swiper";
import { displayDigits } from "@/lib/persian-digits";
import { cn } from "@/lib/utils";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import { BLUR_DATA_URL } from "@/lib/image-blur";
import { resolveHomeSliderBannerImage, isStaticPublicSliderBanner } from "@/lib/home/slider-banner-images";
import { RtlSwiper } from "@/components/ui/RtlSwiper";
import type { Product } from "@/lib/types";
import "swiper/css/effect-fade";

const INTERVAL_MS = 6200;
const SLIDER_IMAGE_QUALITY = 92;

function HomeSliderSlideImage({ slide, priority }: { slide: Product; priority?: boolean }) {
  const bannerImage = resolveHomeSliderBannerImage(slide);
  const isNativeBanner = isStaticPublicSliderBanner(bannerImage);

  return (
    <Link
      href={`/product/${slide.id}`}
      className="absolute inset-0 block"
      aria-label={displayDigits(slide.name)}
    >
      <Image
        src={bannerImage}
        alt={slide.name}
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority={priority}
        unoptimized={isNativeBanner}
        quality={isNativeBanner ? undefined : SLIDER_IMAGE_QUALITY}
        placeholder={isNativeBanner ? "empty" : "blur"}
        blurDataURL={isNativeBanner ? undefined : BLUR_DATA_URL}
      />
    </Link>
  );
}

export function HomeProductBannerSlider() {
  const { sliders: slides, isLoading } = useHomeDataContext();
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const hasMultiple = slides.length > 1;

  if (isLoading) {
    return (
      <section className={homeBannerSliderSection} aria-busy="true">
        <div className="w-full">
          <div className={cn(homeBannerSliderTrack, "sk overflow-hidden")} />
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const active = slides[index] ?? slides[0];

  return (
    <section
      className={homeBannerSliderSection}
      role="region"
      aria-roledescription="carousel"
      aria-label={fa.home.bannerEyebrow}
    >
      <div className="w-full">
        <div className="relative w-full overflow-hidden bg-[#f7f4ef]">
          <div className={cn(homeBannerSliderTrack, homeBannerSliderSwiperHeight, "overflow-hidden")}>
            <RtlSwiper
              className="h-full w-full"
              wrapperClassName="h-full w-full"
              contentClassName="h-full"
              navPlacement="banner"
              showNav={hasMultiple}
              showPagination={hasMultiple}
              paginationLabel={fa.home.bannerEyebrow}
              bulletClass={homeBannerSliderPaginationBullet}
              bulletActiveClass={homeBannerSliderPaginationBulletActive}
              prevLabel={fa.home.bannerPrev}
              nextLabel={fa.home.bannerNext}
              extraModules={[Autoplay, EffectFade]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              loop={hasMultiple}
              speed={reduceMotion ? 0 : 550}
              allowTouchMove={hasMultiple}
              autoplay={
                hasMultiple && !reduceMotion
                  ? {
                      delay: INTERVAL_MS,
                      disableOnInteraction: true,
                      pauseOnMouseEnter: true,
                    }
                  : false
              }
              onSlideIndexChange={(i) => setIndex(i)}
            >
              {slides.map((slide, i) => (
                <SwiperSlide key={slide.id} className="relative !h-full">
                  <HomeSliderSlideImage slide={slide} priority={i === 0} />
                </SwiperSlide>
              ))}
            </RtlSwiper>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {fa.home.bannerSlideStatus(index + 1, slides.length)} — {displayDigits(active.name)}
        </p>
      </div>
    </section>
  );
}
