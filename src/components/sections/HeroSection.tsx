"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { SITE_IMAGE_1 } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";
import { useAbExperiment } from "@/lib/hooks/useAbExperiment";
import { trackAbEvent } from "@/lib/ab/tracker";

const stats = [
  { value: "۹۲۵", label: fa.home.heroMetric1 },
  { value: "۱۰۰٪", label: fa.home.heroMetric2 },
  { value: "تومان", label: fa.home.heroMetric3 },
];

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.12 + i * 0.09, ease },
  }),
};

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const ctaExperiment = useAbExperiment("hero_cta_v1");
  const ctaPrimaryHref = ctaExperiment.variantId === "customize_first" ? "/customize" : "/shop";
  const ctaPrimaryLabel =
    ctaExperiment.variantId === "customize_first" ? fa.home.designRing : fa.commerce.heroShopPrimary;
  const ctaSecondaryHref = ctaExperiment.variantId === "customize_first" ? "/shop" : "/customize";
  const ctaSecondaryLabel =
    ctaExperiment.variantId === "customize_first" ? fa.commerce.heroShopPrimary : fa.home.designRing;

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

  return (
    <section ref={sectionRef} className="heritage-hero" aria-label={fa.home.heroEyebrow}>
      <div className="hero-fade-bottom" aria-hidden />

      <motion.div
        className="pointer-events-none absolute -start-32 top-0 h-64 w-64 rounded-full bg-gold/10 blur-[100px] md:h-80 md:w-80"
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -end-24 bottom-0 h-56 w-56 rounded-full bg-turquoise/10 blur-[90px] md:h-64 md:w-64"
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        aria-hidden
      />

      <div className="site-container relative z-10 pb-4 pt-0 md:pb-6">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10 lg:items-stretch xl:gap-12">
          <motion.div style={{ y: textY }} className="order-2 min-w-0 text-center lg:order-1 lg:text-start">
            <motion.div custom={0} variants={reveal} initial="hidden" animate="visible">
              <span className="hero-kicker mx-auto lg:mx-0">
                <span className="hero-kicker-dot" />
                {fa.home.heroEyebrow}
              </span>
            </motion.div>

            <motion.div custom={1} variants={reveal} initial="hidden" animate="visible">
              <motion.div
                className="hero-brand-lockup"
                aria-label={`${fa.home.heroTitle1} ${fa.home.heroTitle3Lead} ${fa.home.heroTitle3Accent}`}
              >
                <h1 className="hero-headline">
                  <span className="hero-headline-primary">
                    <span className="hero-headline-text">{fa.home.heroTitle1}</span>
                  </span>
                  <span className="hero-headline-closing">
                    <span className="hero-headline-closing-prefix">{fa.home.heroTitle3Lead}</span>
                    <span className="hero-headline-closing-accent">{fa.home.heroTitle3Accent}</span>
                  </span>
                </h1>
              </motion.div>
            </motion.div>

            <motion.p
              custom={3}
              variants={reveal}
              initial="hidden"
              animate="visible"
              className="hero-lead mx-auto lg:mx-0"
            >
              {fa.home.heroSubtitle}
            </motion.p>

            <motion.div
              custom={4}
              variants={reveal}
              initial="hidden"
              animate="visible"
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link href={ctaPrimaryHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full shadow-luxury-gold sm:min-w-[11.5rem]"
                  onClick={() => trackCtaConversion("primary")}
                >
                  {ctaPrimaryLabel}
                </Button>
              </Link>
              <Link href={ctaSecondaryHref} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:min-w-[10rem]"
                  onClick={() => trackCtaConversion("secondary")}
                >
                  {ctaSecondaryLabel}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              custom={5}
              variants={reveal}
              initial="hidden"
              animate="visible"
              className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {stats.map((s) => (
                <div key={s.label} className="hero-metric-pill min-w-[5.5rem] flex-1 sm:flex-none">
                  <span className="font-display text-base font-semibold text-gold-dark">{s.value}</span>
                  <span className="mt-0.5 text-[10px] text-silver">{s.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.p
              custom={6}
              variants={reveal}
              initial="hidden"
              animate="visible"
              className="hero-commerce-assist mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-silver lg:mx-0 lg:text-start"
            >
              {fa.commerce.heroAssistLine}
            </motion.p>
          </motion.div>

          <motion.div
            style={{ y: visualY }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease }}
            className="hero-visual order-1 min-w-0 w-full lg:order-2"
          >
            {/* قاب اصلی — بدون لایه‌های شلوغ روی عکس */}
            <div className="hero-visual-frame">
              <div className="relative w-full min-w-0 overflow-hidden rounded-heritage bg-parchment/40 shadow-hojreh ring-1 ring-gold/10 aspect-[4/5] sm:aspect-[5/6] lg:aspect-auto lg:h-[min(56vh,480px)] lg:min-h-[300px]">
                <Image
                  src={SITE_IMAGE_1}
                  alt={`انگشتر دست‌ساز ${fa.brand.name}`}
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 1024px) 92vw, (max-width: 1280px) 48vw, 560px"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/25 via-transparent to-stone-950/[0.07]"
                  aria-hidden
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
