"use client";

import Image from "next/image";
import { SITE_IMAGE_2 } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function BrandStory() {
  return (
    <section className="heritage-section">
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.heritageEyebrow}
          title={fa.home.heritageTitle}
          subtitle={fa.home.heritageSubtitle}
        />
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <ScrollReveal direction="end">
            <div className="heritage-frame">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[0.875rem]">
                <Image
                  src={SITE_IMAGE_2}
                  alt="صنعتگر در حال ساخت جواهر"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 520px"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-parchment/40 via-transparent to-transparent" />
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="start" delay={0.2}>
            <div className="space-y-6 text-silver">
              <p className="text-lg leading-relaxed">{fa.home.heritageP1}</p>
              <p className="leading-relaxed">{fa.home.heritageP2}</p>
              <p className="font-display text-xl text-turquoise-dark">{fa.home.heritageQuote}</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
