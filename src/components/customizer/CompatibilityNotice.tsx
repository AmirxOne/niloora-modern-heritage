"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

export interface CompatibilityNoticeItem {
  fieldLabel: string;
  fromLabel: string;
  toLabel: string;
  reason: string;
}

interface CompatibilityNoticeProps {
  items: CompatibilityNoticeItem[];
  onDismiss: () => void;
}

export function CompatibilityNotice({ items, onDismiss }: CompatibilityNoticeProps) {
  return (
    <AnimatePresence>
      {items.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 rounded-heritage border border-turquoise/30 bg-turquoise/10 p-4"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-turquoise-dark">
                {fa.customize.compatibility.title}
              </p>
              <p className="mt-1 text-xs text-silver">{fa.customize.compatibility.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-heritage text-silver transition-colors hover:bg-white/10 hover:text-ivory"
              aria-label={fa.common.close}
            >
              <X size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {items.map((item, i) => (
              <motion.li
                key={`${item.fieldLabel}-${i}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs leading-relaxed text-ivory"
              >
                <span className="text-gold">{item.fieldLabel}:</span>{" "}
                {item.fromLabel !== item.toLabel ? (
                  <>
                    «{item.fromLabel}» → «{item.toLabel}»
                    <span className="mt-0.5 block text-silver/80">{item.reason}</span>
                  </>
                ) : (
                  <span>{item.reason}</span>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
