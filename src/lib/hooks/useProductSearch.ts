"use client";

import { useEffect, useState } from "react";
import { fetchProductSearch } from "@/lib/products/search-api";
import type { Product } from "@/lib/types";

const DEBOUNCE_MS = 320;

export function useProductSearch(query: string) {
  const trimmed = query.trim();
  const [catalogHits, setCatalogHits] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [resolvedQuery, setResolvedQuery] = useState("");

  useEffect(() => {
    if (!trimmed) {
      setCatalogHits([]);
      setIsSearching(false);
      setSearchFailed(false);
      setResolvedQuery("");
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchFailed(false);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchProductSearch(trimmed, controller.signal);
          if (controller.signal.aborted) return;
          if (!data) {
            setSearchFailed(true);
            setCatalogHits([]);
            setResolvedQuery(trimmed);
            return;
          }
          setCatalogHits(data.products.catalog ?? []);
          setResolvedQuery(data.query);
          setSearchFailed(false);
        } catch (error) {
          if (controller.signal.aborted) return;
          setSearchFailed(true);
          setCatalogHits([]);
          setResolvedQuery(trimmed);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  return {
    hasQuery: Boolean(trimmed),
    catalogHits,
    isSearching,
    searchFailed,
    resolvedQuery,
  };
}
