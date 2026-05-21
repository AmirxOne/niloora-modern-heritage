"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { useHomeDataContext } from "@/lib/context/HomeDataContext";
import { Button } from "@/components/ui/Button";

export function HomePromoStrip() {
  const { banner } = useHomeDataContext();

  if (!banner.enabled) return null;

  return (
    <section className="home-promo-strip" aria-label={banner.title}>
      <div className="site-container flex flex-col items-center justify-between gap-3 py-4 md:flex-row md:gap-5 md:py-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="max-w-3xl text-center md:text-start"
        >
          <p className="font-display text-base font-semibold text-ivory md:text-lg">
            {banner.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-silver">{banner.subtitle}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="shrink-0"
        >
          <Link href={banner.ctaHref || "/shop"}>
            <Button variant="turquoise" size="md">
              {banner.ctaLabel || fa.home.promoStripCta}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
