"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { SITE_IMAGE_1, SITE_IMAGE_2 } from "@/lib/images";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="about-page pt-6 md:pt-8">
        <section className="about-hero relative flex min-h-[70vh] items-center justify-center overflow-hidden">
          <Image src={SITE_IMAGE_1} alt="صنعتگری انگشتر فاخر" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-900/20 to-matte" />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="about-hero-content relative z-10 mx-auto max-w-3xl px-4 text-center">
            <p className="text-xs tracking-widest text-turquoise">{fa.about.eyebrow}</p>
            <h1 className="mt-4 font-display text-5xl text-stone-900 md:text-7xl">
              {fa.about.title1}
              <span className="block text-gradient-gold">{fa.about.title2}</span>
            </h1>
            <p className="mt-6 text-lg text-silver">{fa.about.subtitle}</p>
          </motion.div>
        </section>

        <section className="about-section py-24 md:py-32">
          <div className="site-container">
            <div className="about-section-shell grid items-center gap-16 lg:grid-cols-2">
              <ScrollReveal direction="end">
                <h2 className="font-display text-4xl text-ivory md:text-5xl">{fa.about.philosophyTitle}</h2>
                <p className="mt-6 text-lg leading-relaxed text-silver">{fa.about.philosophyP1}</p>
                <p className="mt-4 leading-relaxed text-silver">{fa.about.philosophyP2}</p>
              </ScrollReveal>
              <ScrollReveal direction="start" delay={0.2}>
                <div className="relative aspect-square overflow-hidden rounded-sm">
                  <Image src={SITE_IMAGE_2} alt="استاد جواهرساز" fill className="object-cover" />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section id="craftsmanship" className="about-craftsmanship bg-matte-elevated/50 py-24 md:py-32">
          <div className="site-container">
            <SectionHeading eyebrow={fa.about.processEyebrow} title={fa.about.processTitle} subtitle={fa.about.processSubtitle} />
            <div className="about-steps space-y-8">
              {fa.about.steps.map((step, i) => (
                <ScrollReveal key={step.title} delay={i * 0.1}>
                  <motion.div whileHover={{ x: -8 }} transition={{ duration: 0.4 }} className="about-step-card flex gap-8 rounded-sm border border-subtle bg-matte-elevated p-8 md:gap-12">
                    <span className="font-display text-4xl text-gold/40 md:text-5xl">{String(i + 1).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}</span>
                    <div>
                      <h3 className="font-display text-2xl text-ivory">{step.title}</h3>
                      <p className="mt-3 max-w-2xl text-silver">{step.description}</p>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="about-cta py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="about-cta-shell mx-auto max-w-2xl px-4">
            <h2 className="font-display text-3xl text-ivory md:text-4xl">{fa.about.ctaTitle}</h2>
            <p className="mt-4 text-silver">{fa.about.ctaSubtitle}</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/customize"><Button size="lg">{fa.home.designRing}</Button></Link>
              <Link href="/shop"><Button variant="outline" size="lg">{fa.home.exploreCollection}</Button></Link>
            </div>
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
}
