"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { RingPreview } from "@/components/customizer/RingPreview";
import { defaultCustomizerState } from "@/lib/customizer-pricing";

export function CustomizerCTA() {
  return (
    <section className="heritage-section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-heritage-gradient opacity-50" />
      <div className="site-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="heritage-eyebrow !mb-2">{fa.home.atelierEyebrow}</p>
            <h2 className="mt-4 font-display text-4xl text-ivory md:text-5xl">
              {fa.home.atelierTitle1}
              <span className="text-gradient-gold">{fa.home.atelierTitle2}</span>
            </h2>
            <p className="mt-6 max-w-lg text-silver">{fa.home.atelierSubtitle}</p>
            <ul className="mt-8 space-y-3 text-sm text-silver">
              {fa.home.atelierFeatures.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="h-1 w-1 rounded-full bg-turquoise" />
                  {item}
                </motion.li>
              ))}
            </ul>
            <Link href="/customize" className="mt-10 inline-block">
              <Button size="lg" variant="turquoise">
                {fa.home.enterAtelier}
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <div className="heritage-frame p-6 md:p-8">
              <RingPreview state={defaultCustomizerState} size="md" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
