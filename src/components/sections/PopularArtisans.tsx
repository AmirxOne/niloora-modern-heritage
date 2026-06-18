"use client";

import { useState } from "react";
import Link from "next/link";
import { SwiperSlide } from "swiper/react";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RtlSwiper } from "@/components/ui/RtlSwiper";
import { ArtisanCard } from "@/components/artisans/ArtisanCard";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import {
  productRailSlide,
  productRailSlideInner,
  productRailSwiper,
  productRailWrap,
} from "@/lib/styles/product-rail-swiper";

const artisanRailBreakpoints = {
  0: { slidesPerView: 1.1, slidesPerGroup: 1, spaceBetween: 12 },
  640: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 14 },
  1024: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 16 },
  1280: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 16 },
} as const;

export function PopularArtisans() {
  const { popularArtisans: artisans, isLoading } = useHomeDataContext();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isLoading && artisans.length === 0) return null;

  return (
    <section
      className="heritage-section"
      dir="rtl"
      aria-roledescription="carousel"
      aria-label={fa.home.popularArtisansTitle}
    >
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.popularArtisansEyebrow}
          title={fa.home.popularArtisansTitle}
          subtitle={fa.home.popularArtisansSubtitle}
          className="!mb-6 md:!mb-8 [&_.mt-5]:!mt-4"
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="sk h-72 rounded-heritage-lg" />
            ))}
          </div>
        ) : artisans.length > 1 ? (
          <RtlSwiper
            navPlacement="product-rail"
            wrapperClassName={productRailWrap}
            className={productRailSwiper}
            breakpoints={artisanRailBreakpoints}
            slidesPerView={1.1}
            spaceBetween={12}
            slidesPerGroup={1}
            speed={520}
            showNav
            showPagination={false}
            prevLabel={fa.home.popularArtisansPrev}
            nextLabel={fa.home.popularArtisansNext}
            navIconSize="md"
            disableNavAtEnds={false}
            onSlideIndexChange={(i) => setActiveIndex(i)}
          >
            {artisans.map((artisan) => (
              <SwiperSlide key={artisan.slug} className={productRailSlide}>
                <div className={productRailSlideInner}>
                  <ArtisanCard artisan={artisan} />
                </div>
              </SwiperSlide>
            ))}
          </RtlSwiper>
        ) : (
          <ArtisanCard artisan={artisans[0]} />
        )}

        {artisans.length > 1 ? (
          <p className="sr-only" aria-live="polite">
            {fa.home.popularArtisansSlideStatus(activeIndex + 1, artisans.length)}
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm md:mt-8">
          <Link href="/artisans" className="text-turquoise-dark transition-colors hover:text-turquoise">
            {fa.artisans.viewAll}
          </Link>
        </p>
      </div>
    </section>
  );
}
