"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clampPage, getTotalPages, paginateSlice } from "@/lib/pagination";

export interface UsePaginationOptions {
  /** صفحهٔ کنترل‌شده از بیرون (مثلاً query string) */
  page?: number;
  onPageChange?: (page: number) => void;
}

export function usePagination<T>(
  items: readonly T[],
  pageSize: number,
  resetKey?: string | number,
  options?: UsePaginationOptions
) {
  const [internalPage, setInternalPage] = useState(1);
  const isControlled = options?.page != null && options.onPageChange != null;
  const page = isControlled ? options.page! : internalPage;

  const totalItems = items.length;
  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = clampPage(page, totalPages);

  useEffect(() => {
    if (!isControlled) setInternalPage(1);
  }, [resetKey, isControlled]);

  useEffect(() => {
    if (!isControlled && safePage !== internalPage) {
      setInternalPage(safePage);
    }
  }, [safePage, internalPage, isControlled]);

  useEffect(() => {
    if (isControlled && safePage !== options!.page!) {
      options!.onPageChange!(safePage);
    }
  }, [isControlled, safePage, options]);

  const paginatedItems = useMemo(
    () => paginateSlice(items, safePage, pageSize),
    [items, safePage, pageSize]
  );

  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  const setPage = useCallback(
    (next: number | ((prev: number) => number)) => {
      const resolved =
        typeof next === "function"
          ? next(isControlled ? options!.page! : internalPage)
          : next;
      const clamped = clampPage(resolved, totalPages);
      if (isControlled) options!.onPageChange!(clamped);
      else setInternalPage(clamped);
    },
    [internalPage, isControlled, options, totalPages]
  );

  return {
    page: safePage,
    setPage,
    totalPages,
    paginatedItems,
    from,
    to,
    totalItems,
    pageSize,
    showPagination: totalPages > 1,
  };
}
