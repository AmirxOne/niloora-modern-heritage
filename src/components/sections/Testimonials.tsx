"use client";

import { motion } from "framer-motion";
import { Star } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";

export function Testimonials() {
  const { testimonials, isLoading } = useHomeDataContext();

  return (
    <section className="heritage-section-alt">
      <div className="site-container">
        <SectionHeading eyebrow={fa.home.testimonialsEyebrow} title={fa.home.testimonialsTitle} />
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <blockquote
                  key={idx}
                  className="heritage-card flex h-full flex-col p-5 md:p-6"
                  aria-busy="true"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((__, starIdx) => (
                      <span key={starIdx} className="sk inline-block h-4 w-4 rounded-full" />
                    ))}
                  </div>
                  <div className="sk h-3 w-full" />
                  <div className="sk mt-2 h-3 w-11/12" />
                  <div className="sk mt-2 h-3 w-9/12" />
                  <footer className="mt-6 border-t border-[#F0EDE9] pt-6">
                    <div className="sk h-4 w-28" />
                    <div className="sk mt-2 h-3 w-24" />
                  </footer>
                </blockquote>
              ))
            : testimonials.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 0.1}>
                  <motion.blockquote
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.4 }}
                    className="heritage-card flex h-full flex-col p-5 md:p-6"
                  >
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-gold text-gold"
                          fill="currentColor"
                          size={iconSizes.sm}
                          variant={ICON_VARIANT}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-silver">«{t.text}»</p>
                    <footer className="mt-6 border-t border-subtle pt-6">
                      <p className="font-medium text-ivory">{t.name}</p>
                      <p className="text-xs text-silver">{t.location}</p>
                    </footer>
                  </motion.blockquote>
                </ScrollReveal>
              ))}
        </div>
      </div>
    </section>
  );
}
