"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE, normalizePageSize } from "@/lib/pagination";

interface UsePaginationUrlStateOptions {
  pageParamName?: string;
  pageSizeParamName?: string;
}

function parsePage(value: string | null): number {
  if (!value) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function usePaginationUrlState(options: UsePaginationUrlStateOptions = {}) {
  const { pageParamName = "page", pageSizeParamName = "pageSize" } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(() => parsePage(searchParams.get(pageParamName)), [pageParamName, searchParams]);
  const pageSize = useMemo(
    () => normalizePageSize(Number.parseInt(searchParams.get(pageSizeParamName) ?? "", 10)),
    [pageSizeParamName, searchParams]
  );

  const replace = useCallback(
    (nextPage: number, nextPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage > 1) params.set(pageParamName, String(nextPage));
      else params.delete(pageParamName);

      if (nextPageSize !== DEFAULT_PAGE_SIZE) params.set(pageSizeParamName, String(nextPageSize));
      else params.delete(pageSizeParamName);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pageParamName, pageSizeParamName, pathname, router, searchParams]
  );

  const setPage = useCallback((nextPage: number) => replace(nextPage, pageSize), [pageSize, replace]);
  const setPageSize = useCallback((nextPageSize: number) => replace(1, nextPageSize), [replace]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}
