"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fa } from "@/lib/i18n/fa";
import { ArrowLeft, Recycle } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { Button } from "@/components/ui/Button";

export function PreOwnedShopStrip() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pre-owned-shop-strip"
      aria-labelledby="pre-owned-strip-title"
    >
      <div className="pre-owned-shop-strip-icon" aria-hidden>
        <Recycle size={iconSizes.lg} variant={ICON_VARIANT} />
      </div>
      <div className="pre-owned-shop-strip-body">
        <p className="pre-owned-shop-strip-eyebrow">{fa.preOwned.eyebrow}</p>
        <h2 id="pre-owned-strip-title" className="pre-owned-shop-strip-title">
          {fa.preOwned.shopStripTitle}
        </h2>
        <p className="pre-owned-shop-strip-subtitle">{fa.preOwned.shopStripSubtitle}</p>
        <div className="pre-owned-shop-strip-actions">
          <Link href="/shop?condition=pre-owned">
            <Button>{fa.preOwned.browseCta}</Button>
          </Link>
          <Link href="/pre-owned/sell">
            <Button variant="outline">{fa.preOwned.sellCta}</Button>
          </Link>
          <Link href="/pre-owned" className="pre-owned-shop-strip-link">
            {fa.preOwned.learnMore}
            <ArrowLeft className="h-4 w-4" variant={ICON_VARIANT} aria-hidden />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
