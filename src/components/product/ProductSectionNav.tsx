"use client";

import { useCallback, useEffect, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

export type ProductSectionId =
  | "product-section-specs"
  | "product-section-comments"
  | "product-section-questions";

const SECTIONS: { id: ProductSectionId; label: string }[] = [
  { id: "product-section-specs", label: fa.product.sectionSpecs },
  { id: "product-section-comments", label: fa.product.sectionComments },
  { id: "product-section-questions", label: fa.product.sectionQuestions },
];

export const PRODUCT_SECTION_NAV_ID = "product-section-nav";

export function scrollToProductSection(id: ProductSectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function scrollToProductSectionNav() {
  const el = document.getElementById(PRODUCT_SECTION_NAV_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface ProductSectionNavProps {
  className?: string;
}

export function ProductSectionNav({ className }: ProductSectionNavProps) {
  const [activeId, setActiveId] = useState<ProductSectionId>("product-section-specs");

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) {
          setActiveId(top.target.id as ProductSectionId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: ProductSectionId) => {
    scrollToProductSection(id);
    setActiveId(id);
  }, []);

  return (
    <nav
      id={PRODUCT_SECTION_NAV_ID}
      className={cn("product-section-nav", className)}
      aria-label={fa.product.sectionNavAria}
    >
      <ul className="product-section-nav-list">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={cn(
                "product-section-nav-btn",
                activeId === section.id && "product-section-nav-btn--active"
              )}
              onClick={() => scrollTo(section.id)}
              aria-current={activeId === section.id ? "true" : undefined}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
