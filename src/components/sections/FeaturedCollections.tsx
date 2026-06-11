"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { SITE_IMAGE_1, SITE_IMAGE_2 } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

const collectionImages: Record<string, string> = {
  "royal-heritage": SITE_IMAGE_1,
  "ancient-dynasty": SITE_IMAGE_2,
  "modern-nobility": SITE_IMAGE_1,
};

export function FeaturedCollections() {
  const { collections, isLoading } = useHomeDataContext();

  return (
    <section className="heritage-section">
      <div className="site-container">
        <SectionHeading
          eyebrow={fa.home.collectionsEyebrow}
          title={fa.home.collectionsTitle}
          subtitle={fa.home.collectionsSubtitle}
        />
        <div className="grid gap-3 md:grid-cols-3 md:gap-3.5">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="heritage-frame overflow-hidden" aria-busy="true">
                  <div className="sk relative aspect-[4/5] overflow-hidden rounded-[0.875rem]">
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                      <div className="sk h-3 w-24" />
                      <div className="sk mt-2 h-7 w-36" />
                      <div className="sk mt-4 h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))
            : collections.map((col, i) => (
                <ScrollReveal key={col.id} delay={i * 0.1}>
                  <Link href={`/shop?collection=${col.id}`} className="group block">
                    <motion.div
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="heritage-frame overflow-hidden"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[0.875rem]">
                        <Image
                          src={collectionImages[col.id] ?? collectionImages["royal-heritage"]}
                          alt={col.name}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                          <p className="text-[11px] font-medium tracking-wide text-turquoise-light">
                            {col.namePersian}
                          </p>
                          <h3 className="mt-0.5 font-display text-lg font-medium text-white md:text-xl">
                            {col.name}
                          </h3>
                          <span className="mt-3 inline-flex items-center gap-1 text-xs text-gold-light opacity-0 transition-opacity group-hover:opacity-100">
                            {fa.common.explore}
                            <span aria-hidden>←</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </ScrollReveal>
              ))}
        </div>
      </div>
    </section>
  );
}
