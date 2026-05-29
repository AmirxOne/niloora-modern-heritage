"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { fetchProductSearch } from "@/lib/products/search-api";
import type { Product } from "@/lib/types";
import { TextBox } from "@/components/inputs";
import { iconSizes, ICON_VARIANT } from "@/lib/icons";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { cn } from "@/lib/utils";

const quickLinks = [
  { href: "/shop", label: fa.nav.collection },
  { href: "/shop?collectionId=royal-heritage", label: fa.footer.royalHeritage },
  { href: "/customize", label: fa.nav.atelier },
];

const PREVIEW_LIMIT = 6;
const PREVIEW_MIN_CHARS = 2;

type SearchDropdownProps = {
  panelId: string;
  query: string;
  showPreview: boolean;
  previewLoading: boolean;
  preview: Product[];
  previewTotal: number;
  onClose: () => void;
  onGoToShopSearch: (q: string) => void;
  className?: string;
};

function SearchDropdown({
  panelId,
  query,
  showPreview,
  previewLoading,
  preview,
  previewTotal,
  onClose,
  onGoToShopSearch,
  className,
}: SearchDropdownProps) {
  return (
    <div
      id={panelId}
      className={cn("header-search-dropdown", className)}
      role="listbox"
      aria-label={fa.nav.search}
    >
      {showPreview ? (
        <section className="header-search-dropdown__section">
          <p className="header-search-dropdown__label">{fa.shop.searchPreviewTitle}</p>
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
                      role="option"
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
                        <span className="block truncate">
                          <TomanPrice amount={product.price} size="xs" />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="header-search-preview-all"
                onClick={() => onGoToShopSearch(query)}
              >
                {previewTotal > PREVIEW_LIMIT
                  ? fa.shop.searchViewAll(previewTotal)
                  : fa.shop.searchPageTitle}
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="header-search-dropdown__section">
          <p className="text-xs leading-relaxed text-silver">{fa.nav.searchHint}</p>
        </section>
      )}

      <section className="header-search-dropdown__section">
        <p className="header-search-dropdown__label">{fa.nav.searchQuickLinks}</p>
        <div className="header-search-quick-links">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="header-search-quick-link"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function useHeaderSearch(onClose?: () => void) {
  const router = useRouter();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Product[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(0);

  const trimmedQuery = query.trim();
  const showPreview = trimmedQuery.length >= PREVIEW_MIN_CHARS;

  const reset = useCallback(() => {
    setQuery((prev) => (prev === "" ? prev : ""));
    setPreview((prev) => (prev.length === 0 ? prev : []));
    setPreviewTotal((prev) => (prev === 0 ? prev : 0));
    setPreviewLoading((prev) => (prev === false ? prev : false));
  }, []);

  const close = useCallback(() => {
    onClose?.();
    reset();
  }, [onClose, reset]);

  const goToShopSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      close();
      router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
    },
    [router, close]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      goToShopSearch(query);
    },
    [query, goToShopSearch]
  );

  useEffect(() => {
    if (trimmedQuery.length < PREVIEW_MIN_CHARS) {
      setPreview((prev) => (prev.length === 0 ? prev : []));
      setPreviewTotal((prev) => (prev === 0 ? prev : 0));
      setPreviewLoading((prev) => (prev === false ? prev : false));
      return;
    }

    const controller = new AbortController();
    setPreviewLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchProductSearch(trimmedQuery, controller.signal);
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
  }, [trimmedQuery]);

  return {
    panelId,
    inputRef,
    query,
    setQuery,
    preview,
    previewLoading,
    previewTotal,
    showPreview,
    handleSearch,
    goToShopSearch,
    close,
    reset,
  };
}

type HeaderSearchExpandProps = {
  mode: "expand";
  open: boolean;
  onClose: () => void;
};

type HeaderSearchInlineProps = {
  mode: "inline";
};

export type HeaderSearchProps = HeaderSearchExpandProps | HeaderSearchInlineProps;

function HeaderSearchInline() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const search = useHeaderSearch(() => setDropdownOpen(false));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (shellRef.current?.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [dropdownOpen]);

  return (
    <div ref={shellRef} className="header-search-inline-shell" role="search" aria-label={fa.nav.search}>
      <form onSubmit={search.handleSearch} className="header-search-inline-field">
        <Search className="header-search-inline-icon" variant={ICON_VARIANT} aria-hidden />
        <TextBox
          ref={search.inputRef}
          type="search"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          placeholder={fa.nav.searchPlaceholder}
          autoComplete="off"
          aria-controls={search.panelId}
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          inputClassName="header-search-inline-input"
          className="min-w-0 flex-1"
        />
      </form>

      <AnimatePresence initial={false}>
        {dropdownOpen ? (
          <motion.div
            key="header-search-inline-dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <SearchDropdown
              panelId={search.panelId}
              query={search.query}
              showPreview={search.showPreview}
              previewLoading={search.previewLoading}
              preview={search.preview}
              previewTotal={search.previewTotal}
              onClose={() => {
                setDropdownOpen(false);
                search.reset();
              }}
              onGoToShopSearch={search.goToShopSearch}
              className="header-search-dropdown--inline"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HeaderSearchExpand({ open, onClose }: HeaderSearchExpandProps) {
  const search = useHeaderSearch(onClose);
  const { reset, inputRef } = search;
  const wasOpenRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("header-search-active", open);
    return () => document.documentElement.classList.remove("header-search-active");
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      reset();
    }
    wasOpenRef.current = open;
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose, inputRef]);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="header-search-expand"
          role="search"
          aria-label={fa.nav.search}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="header-search-expand"
        >
          <div className="header-search-expand__inner">
            <form onSubmit={search.handleSearch} className="header-search-form">
              <div className="header-search-input-wrap">
                <Search
                  className="header-search-input-icon"
                  variant={ICON_VARIANT}
                  aria-hidden
                />
                <TextBox
                  ref={search.inputRef}
                  type="search"
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  placeholder={fa.nav.searchPlaceholder}
                  autoComplete="off"
                  aria-controls={search.panelId}
                  aria-expanded="true"
                  aria-autocomplete="list"
                  inputClassName="w-full"
                  className="w-full"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="header-search-close"
                aria-label={fa.common.close}
              >
                <X size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
              </button>
            </form>

            <SearchDropdown
              panelId={search.panelId}
              query={search.query}
              showPreview={search.showPreview}
              previewLoading={search.previewLoading}
              preview={search.preview}
              previewTotal={search.previewTotal}
              onClose={onClose}
              onGoToShopSearch={search.goToShopSearch}
              className="header-search-dropdown--expand"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function HeaderSearch(props: HeaderSearchProps) {
  if (props.mode === "inline") {
    return <HeaderSearchInline />;
  }
  return <HeaderSearchExpand {...props} />;
}
