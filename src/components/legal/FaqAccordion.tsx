"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type FaqItem = {
  readonly category?: string;
  readonly question: string;
  readonly answer: string;
};

const panelTransition = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function FaqAccordion({
  items,
  emptyMessage,
}: {
  items: readonly FaqItem[];
  emptyMessage?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    setOpenIndex((prev) => {
      if (items.length === 0) return null;
      if (prev !== null && prev < items.length) return prev;
      return 0;
    });
  }, [items]);

  if (items.length === 0) {
    return emptyMessage ? <p className="faq-empty">{emptyMessage}</p> : null;
  }

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className="faq-accordion-item">
            <button
              type="button"
              className="faq-accordion-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <ChevronDown
                size={iconSizes.sm}
                variant={ICON_VARIANT}
                className={cn(
                  "faq-accordion-chevron shrink-0",
                  isOpen && "faq-accordion-chevron--open"
                )}
                aria-hidden
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: isOpen ? "auto" : 0 }}
              transition={panelTransition}
              className="faq-accordion-panel-wrap"
            >
              <div className="faq-accordion-panel" aria-hidden={!isOpen}>
                <p>{item.answer}</p>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
