"use client";

import { motion } from "framer-motion";
import { BadgeCheck, MessageCircle, Receipt, Truck } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

const items = [
  {
    title: fa.commerce.trustShipping,
    hint: fa.commerce.trustShippingHint,
    Icon: Truck,
  },
  {
    title: fa.commerce.trustAuthenticity,
    hint: fa.commerce.trustAuthenticityHint,
    Icon: BadgeCheck,
  },
  {
    title: fa.commerce.trustConsult,
    hint: fa.commerce.trustConsultHint,
    Icon: MessageCircle,
  },
  {
    title: fa.commerce.trustCheckout,
    hint: fa.commerce.trustCheckoutHint,
    Icon: Receipt,
  },
] as const;

interface SalesTrustStripProps {
  variant?: "default" | "dense";
  className?: string;
}

export function SalesTrustStrip({ variant = "default", className }: SalesTrustStripProps) {
  const dense = variant === "dense";

  return (
    <div
      className={cn("sales-trust-strip", dense && "sales-trust-strip--dense", className)}
      role="region"
      aria-label={fa.commerce.trustAria}
    >
      <div className="site-container">
        <ul className="sales-trust-strip-grid">
          {items.map((item, i) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.24) }}
              className="sales-trust-strip-item"
            >
              <span className="sales-trust-strip-icon" aria-hidden>
                <item.Icon
                  className="h-full w-full"
                  size={iconSizes.md}
                  variant={ICON_VARIANT}
                />
              </span>
              <span className="sales-trust-strip-text">
                <span className="sales-trust-strip-title">{item.title}</span>
                <span className="sales-trust-strip-hint">{item.hint}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
