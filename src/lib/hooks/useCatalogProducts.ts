"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useCatalogProducts(options: UseCatalogProductsOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const paginated = options.paginated ?? true;

  const [products, setProducts] = useState<Product[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = paginated
        ? `/api/products?limit=${pageSize}&offset=0`
        : "/api/products";
      const response = await fetch(url);
      if (!response.ok) return;
      const data = (await response.json()) as CatalogFullResponse | CatalogPagedResponse;
      setProducts(data.products ?? []);
      setMaxPrice(data.maxPrice ?? 0);
      if ("total" in data) {
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        setTotal(data.products?.length ?? 0);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, paginated]);

  const loadMore = useCallback(async () => {
    if (!paginated || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const offset = products.length;
      const response = await fetch(`/api/products?limit=${pageSize}&offset=${offset}`);
      if (!response.ok) return;
      const data = (await response.json()) as CatalogPagedResponse;
      setProducts((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const next = data.products.filter((item) => !seen.has(item.id));
        return [...prev, ...next];
      });
      setMaxPrice(data.maxPrice ?? 0);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, pageSize, paginated, products.length]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return {
    products,
    maxPrice,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    loadProducts,
    loadMore,
  };
}
