"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Gem, Share, SlidersHorizontal, Wallet } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

const featureIcons = [SlidersHorizontal, Wallet, Share] as const;

export function CustomizerCTA() {
  return (
    <section className="customizer-cta-section" aria-labelledby="customizer-cta-heading">
      <div className="site-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="customizer-cta-panel"
        >
          <div className="customizer-cta-panel-glow" aria-hidden />
          <Gem
            className="customizer-cta-watermark"
            size={iconSizes.lg}
            variant={ICON_VARIANT}
            aria-hidden
          />

          <div className="customizer-cta-grid">
            <div className="customizer-cta-main">
              <p className="heritage-eyebrow !mb-0">{fa.home.atelierEyebrow}</p>
              <h2 id="customizer-cta-heading" className="customizer-cta-title">
                {fa.home.atelierTitle1}
                <span className="customizer-cta-title-accent">{fa.home.atelierTitle2}</span>
              </h2>
              <p className="customizer-cta-subtitle">{fa.home.atelierSubtitle}</p>

              <div className="customizer-cta-footer">
                <Link href="/customize" className="customizer-cta-link">
                  <Button size="lg" variant="turquoise" className="customizer-cta-button">
                    {fa.home.enterAtelier}
                    <ArrowLeft
                      size={iconSizes.sm}
                      variant={ICON_VARIANT}
                      className="customizer-cta-button-icon"
                      aria-hidden
                    />
                  </Button>
                </Link>
                <p className="customizer-cta-footnote">{fa.home.atelierFootnote}</p>
              </div>
            </div>

            <ul className="customizer-cta-features">
              {fa.home.atelierFeatures.map((item, index) => {
                const Icon = featureIcons[index] ?? SlidersHorizontal;
                return (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: 0.08 + index * 0.08 }}
                    className="customizer-cta-feature"
                  >
                    <span className="customizer-cta-feature-step" aria-hidden>
                      {(index + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}
                    </span>
                    <span className="customizer-cta-feature-icon" aria-hidden>
                      <Icon size={iconSizes.md} variant={ICON_VARIANT} />
                    </span>
                    <span className="customizer-cta-feature-text">{item}</span>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
