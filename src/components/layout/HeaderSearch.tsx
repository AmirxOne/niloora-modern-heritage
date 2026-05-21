"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { fetchProductSearch } from "@/lib/products/search-api";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextBox } from "@/components/inputs";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { formatPrice } from "@/lib/utils";

const quickLinks = [
  { href: "/shop", label: fa.nav.collection },
  { href: "/shop?collectionId=royal-heritage", label: fa.footer.royalHeritage },
  { href: "/customize", label: fa.nav.atelier },
];

const PREVIEW_LIMIT = 6;
const PREVIEW_MIN_CHARS = 2;

interface HeaderSearchProps {
  open: boolean;
  onClose: () => void;
}

export function HeaderSearch({ open, onClose }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Product[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(0);

  const goToShopSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      onClose();
      setQuery("");
      setPreview([]);
      router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
    },
    [router, onClose]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      goToShopSearch(query);
    },
    [query, goToShopSearch]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPreview([]);
      setPreviewTotal(0);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < PREVIEW_MIN_CHARS) {
      setPreview([]);
      setPreviewTotal(0);
      setPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    setPreviewLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchProductSearch(trimmed, controller.signal);
          if (controller.signal.aborted) return;
          const hits = data?.products.catalog ?? [];
          setPreviewTotal(hits.length);
          setPreview(hits.slice(0, PREVIEW_LIMIT));
        } catch {
          if (!controller.signal.aborted) {
            setPreview([]);
            setPreviewTotal(0);
          }
        } finally {
          if (!controller.signal.aborted) setPreviewLoading(false);
        }
      })();
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-md"
            aria-label={fa.common.close}
            onClick={onClose}
          />

          <motion.div
            role="search"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="header-glass-solid fixed inset-x-0 top-[var(--header-height)] z-[60] border-b border-gold/15 shadow-heritage"
          >
            <div className="site-container mx-auto max-w-site py-5 md:py-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-turquoise-dark">
                    {fa.nav.collection}
                  </p>
                  <h2 className="font-display text-lg font-semibold text-ivory md:text-xl">
                    {fa.nav.search}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-full border border-gold/15 bg-matte-elevated text-silver transition-colors hover:border-gold/30 hover:text-ivory"
                  aria-label={fa.common.close}
                >
                  <X size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
                </button>
              </div>

              <form onSubmit={handleSearch}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold/70"
                      variant={ICON_VARIANT}
                      aria-hidden
                    />
                    <TextBox
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={fa.nav.searchPlaceholder}
                      autoFocus
                      autoComplete="off"
                      inputClassName="w-full ps-12"
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" size="lg" className="shrink-0 sm:min-w-[6.5rem]">
                    <Search size={iconSizes.sm} variant={ICON_VARIANT} className="shrink-0" aria-hidden />
                    {fa.nav.search}
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-silver">{fa.nav.searchHint}</p>
              </form>

              {query.trim().length >= PREVIEW_MIN_CHARS ? (
                <div className="header-search-preview mt-5 border-t border-gold/10 pt-4">
                  <p className="mb-2.5 text-[10px] font-medium tracking-heritage text-silver">
                    {fa.shop.searchPreviewTitle}
                  </p>
                  {previewLoading ? (
                    <p className="text-xs text-silver" aria-live="polite">
                      {fa.shop.searchLoading}
                    </p>
                  ) : preview.length === 0 ? (
                    <p className="text-xs text-silver">{fa.shop.searchPreviewEmpty}</p>
                  ) : (
                    <>
                      <ul className="header-search-preview-list">
                        {preview.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/product/${product.id}`}
                              onClick={onClose}
                              className="header-search-preview-item"
                            >
                              <span className="header-search-preview-thumb">
                                <Image
                                  src={product.image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ivory">
                                  {product.namePersian || product.name}
                                </span>
                                <span className="block truncate text-xs text-silver">
                                  {formatPrice(product.price)}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {previewTotal > PREVIEW_LIMIT ? (
                        <button
                          type="button"
                          className="header-search-preview-all mt-2 text-xs text-turquoise-dark hover:text-turquoise"
                          onClick={() => goToShopSearch(query)}
                        >
                          {fa.shop.searchViewAll(previewTotal)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="header-search-preview-all mt-2 text-xs text-turquoise-dark hover:text-turquoise"
                          onClick={() => goToShopSearch(query)}
                        >
                          {fa.shop.searchPageTitle}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : null}

              <div className="mt-5 border-t border-gold/10 pt-4">
                <p className="mb-2.5 text-[10px] font-medium tracking-heritage text-silver">
                  {fa.nav.searchQuickLinks}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="rounded-full border border-gold/15 bg-parchment/60 px-3.5 py-1.5 text-xs text-ivory-light transition-colors hover:border-gold/25 hover:bg-parchment hover:text-turquoise-dark"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
