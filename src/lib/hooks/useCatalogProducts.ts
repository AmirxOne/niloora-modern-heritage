"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 24;

type CatalogFullResponse = {
  products: Product[];
  maxPrice: number;
};

type CatalogPagedResponse = CatalogFullResponse & {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor: string | null;
};

type UseCatalogProductsOptions = {
  pageSize?: number;
  paginated?: boolean;
};

export type CatalogProductPage = {
  id: string;
  products: Product[];
};

export function useCatalogProducts(options: UseCatalogProductsOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const paginated = options.paginated ?? true;

  const [pages, setPages] = useState<CatalogProductPage[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const loadedCountRef = useRef(0);

  const products = useMemo(() => pages.flatMap((page) => page.products), [pages]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    loadingMoreRef.current = false;
    try {
      const url = paginated
        ? `/api/products?limit=${pageSize}&offset=0`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) return;
      const data = (await response.json()) as CatalogFullResponse | CatalogPagedResponse;
      const firstProducts = data.products ?? [];
      loadedCountRef.current = firstProducts.length;
      setPages(
        firstProducts.length > 0
          ? [{ id: "page-0", products: firstProducts }]
          : []
      );
      setMaxPrice(data.maxPrice ?? 0);
      if ("total" in data) {
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        setTotal(firstProducts.length);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [pageSize, paginated]);

  const loadMore = useCallback(async () => {
    if (!paginated || !hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const offset = loadedCountRef.current;
      const response = await fetch(`/api/products?limit=${pageSize}&offset=${offset}`);
      if (!response.ok) return;
      const data = (await response.json()) as CatalogPagedResponse;
      const nextProducts = data.products ?? [];
      if (nextProducts.length > 0) {
        loadedCountRef.current += nextProducts.length;
        setPages((prev) => {
          const seen = new Set(prev.flatMap((page) => page.products.map((item) => item.id)));
          const unique = nextProducts.filter((item) => !seen.has(item.id));
          if (unique.length === 0) return prev;
          return [
            ...prev,
            { id: `page-${prev.length}-${unique[0]?.id ?? offset}`, products: unique },
          ];
        });
      }
      setMaxPrice(data.maxPrice ?? 0);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, pageSize, paginated]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return {
    pages,
    products,
    maxPrice,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    pageSize,
    loadProducts,
    loadMore,
  };
}
