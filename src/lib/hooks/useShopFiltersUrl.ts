"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createDefaultShopFilters } from "@/lib/shop-filter-utils";
import {
  buildShopSearchParams,
  parseShopFiltersFromParams,
  parseShopPageFromParams,
  parseShopPageSizeFromParams,
} from "@/lib/shop/shop-filter-url";
import type { ShopFilters } from "@/lib/types";

export function useShopFiltersUrl(maxPrice: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseShopFiltersFromParams(searchParams, maxPrice),
    [searchParams, maxPrice]
  );

  const page = useMemo(() => parseShopPageFromParams(searchParams), [searchParams]);
  const pageSize = useMemo(() => parseShopPageSizeFromParams(searchParams), [searchParams]);

  const replaceParams = useCallback(
    (nextFilters: ShopFilters, nextPage: number, nextPageSize: number) => {
      const params = buildShopSearchParams(nextFilters, maxPrice, nextPage, nextPageSize, searchParams);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [maxPrice, pathname, router, searchParams]
  );

  const setFilters = useCallback(
    (next: ShopFilters | ((prev: ShopFilters) => ShopFilters)) => {
      const resolved = typeof next === "function" ? next(filters) : next;
      replaceParams(resolved, 1, pageSize);
    },
    [filters, pageSize, replaceParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      replaceParams(filters, nextPage, pageSize);
    },
    [filters, pageSize, replaceParams]
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      replaceParams(filters, 1, nextPageSize);
    },
    [filters, replaceParams]
  );

  const resetFilters = useCallback(() => {
    replaceParams(createDefaultShopFilters(maxPrice), 1, pageSize);
  }, [maxPrice, pageSize, replaceParams]);

  const safeFilters = useMemo(() => {
    const [min, max] = filters.priceRange;
    const cap = Math.max(0, maxPrice);
    return {
      ...filters,
      priceRange: [Math.min(min, cap), Math.min(max, cap)] as [number, number],
    };
  }, [filters, maxPrice]);

  return {
    filters: safeFilters,
    setFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    resetFilters,
  };
}
