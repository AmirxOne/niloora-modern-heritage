"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FaqAccordion, type FaqItem } from "@/components/legal/FaqAccordion";
import {
  Category,
  Gem,
  MessageCircle,
  MessageQuestion,
  PenTool,
  Receipt,
  Recycle,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  User,
  Verify,
} from "@/components/icons";
import { TextBox } from "@/components/inputs";
import { Button } from "@/components/ui/Button";
import { ICON_VARIANT, iconSizes, type IconComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type FaqCategory = {
  readonly id: string;
  readonly label: string;
};

const FAQ_CATEGORY_ICONS: Record<string, IconComponent> = {
  all: Category,
  order: ShoppingBag,
  shipping: Truck,
  customize: PenTool,
  payment: Receipt,
  sizing: SlidersHorizontal,
  care: Gem,
  returns: Recycle,
  warranty: ShieldCheck,
  account: User,
};

type FaqPageContentProps = {
  heroTitle: string;
  heroSubtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  sidebarLabel: string;
  contactPrompt: string;
  contactEyebrow: string;
  contactSubtitle: string;
  noResults: string;
  contactLabel: string;
  supportLabel: string;
  categories: readonly FaqCategory[];
  items: readonly FaqItem[];
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function FaqCategoryIcon({ categoryId, active }: { categoryId: string; active: boolean }) {
  const Icon = FAQ_CATEGORY_ICONS[categoryId] ?? Verify;

  return (
    <span
      className={cn("faq-category-chip-icon", active && "faq-category-chip-icon--active")}
      aria-hidden
    >
      <Icon size={iconSizes.sm} variant={ICON_VARIANT} />
    </span>
  );
}

export function FaqPageContent({
  heroTitle,
  heroSubtitle,
  searchLabel,
  searchPlaceholder,
  sidebarLabel,
  contactPrompt,
  contactEyebrow,
  contactSubtitle,
  noResults,
  contactLabel,
  supportLabel,
  categories,
  items,
}: FaqPageContentProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set("all", items.length);

    for (const item of items) {
      if (!item.category) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }

    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return items.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = normalizeSearch(`${item.question} ${item.answer}`);
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, items, query]);

  return (
    <div className="faq-page-content">
      <header className="faq-hero">
        <div className="faq-hero-icon" aria-hidden>
          <MessageQuestion size={iconSizes.lg} variant={ICON_VARIANT} />
        </div>
        <h1 className="faq-hero-title">{heroTitle}</h1>
        <p className="faq-hero-subtitle">{heroSubtitle}</p>
        <TextBox
          id="faqSearch"
          label={searchLabel}
          type="search"
          name="faqSearch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          className="faq-search-field"
        />
      </header>

      <div className="faq-layout">
        <aside className="faq-sidebar">
          <p className="faq-sidebar-label">{sidebarLabel}</p>
          <div className="faq-categories" role="tablist" aria-label="دسته‌بندی سوالات">
            {categories.map((category) => {
              const isActive = activeCategory === category.id;
              const count = categoryCounts.get(category.id) ?? 0;

              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn("faq-category-chip", isActive && "faq-category-chip--active")}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <FaqCategoryIcon categoryId={category.id} active={isActive} />
                  <span className="faq-category-chip-label">{category.label}</span>
                  <span className="faq-category-chip-count">{count.toLocaleString("fa-IR")}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="faq-main">
          {filteredItems.length > 0 ? (
            <FaqAccordion items={filteredItems} />
          ) : (
            <div className="faq-empty">
              <p>{noResults}</p>
            </div>
          )}
        </div>
      </div>

      <section className="faq-help-panel" aria-labelledby="faq-help-title">
        <div className="info-contact-cards">
          <div className="faq-help-panel-head">
            <div className="faq-help-panel-icon" aria-hidden>
              <MessageCircle size={iconSizes.lg} variant={ICON_VARIANT} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="heritage-eyebrow">{contactEyebrow}</p>
              <h2 id="faq-help-title" className="info-section-title mt-1">
                {contactPrompt}
              </h2>
              <p className="info-section-p">{contactSubtitle}</p>
            </div>
          </div>
          <div className="info-contact-actions">
            <Link href="/contact">
              <Button variant="turquoise" size="md">
                {contactLabel}
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" size="md">
                {supportLabel}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
