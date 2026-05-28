"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, getVisiblePageTokens, normalizePageSize } from "@/lib/pagination";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SelectBox, type SelectBoxOption } from "@/components/inputs";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  from: number;
  to: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number, nextPage: number) => void;
  className?: string;
  /** برای اسکرول بعد از تغییر صفحه */
  scrollTargetId?: string;
  /** اگر true باشد، page و pageSize را در query string هم به‌روز می‌کند. */
  syncWithQueryParams?: boolean;
  pageParamName?: string;
  pageSizeParamName?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  from,
  to,
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  className,
  scrollTargetId,
  syncWithQueryParams = false,
  pageParamName = "page",
  pageSizeParamName = "pageSize",
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalItems === 0) return null;

  const tokens = getVisiblePageTokens(page, totalPages);
  const normalizedPageSize = normalizePageSize(pageSize, pageSizeOptions);
  const pageSizeSelectOptions: SelectBoxOption[] = pageSizeOptions.map((option) => ({
    value: String(option),
    label: fa.pagination.pageSizeOption(option),
  }));

  const updateQueryParams = (nextPage: number, nextPageSize = normalizedPageSize) => {
    if (!syncWithQueryParams) return;
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage > 1) params.set(pageParamName, String(nextPage));
    else params.delete(pageParamName);

    if (nextPageSize !== DEFAULT_PAGE_SIZE) params.set(pageSizeParamName, String(nextPageSize));
    else params.delete(pageSizeParamName);

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const goTo = (next: number) => {
    if (next === page || next < 1 || next > totalPages) return;
    onPageChange(next);
    updateQueryParams(next);
    if (scrollTargetId && typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById(scrollTargetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const changePageSize = (nextValue: string) => {
    const nextPageSize = normalizePageSize(Number(nextValue), pageSizeOptions);
    onPageSizeChange?.(nextPageSize, 1);
    updateQueryParams(1, nextPageSize);
    if (scrollTargetId && typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById(scrollTargetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  return (
    <nav
      className={cn("pagination", className)}
      aria-label={fa.pagination.ariaLabel}
    >
      <div className="pagination-meta">
        <p className="pagination-summary">
          {fa.pagination.showing(from, to, totalItems)}
        </p>

        {onPageSizeChange ? (
          <label className="pagination-page-size">
            <span>{fa.pagination.pageSizeLabel}</span>
            <SelectBox
              value={String(normalizedPageSize)}
              options={pageSizeSelectOptions}
              onValueChange={changePageSize}
            />
          </label>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-nav"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            aria-label={fa.pagination.prev}
          >
            <ChevronRight size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
            <span>{fa.pagination.prev}</span>
          </button>

          <ol className="pagination-pages" role="list">
            {tokens.map((token, index) =>
              token === "ellipsis" ? (
                <li key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden>
                  …
                </li>
              ) : (
                <li key={token}>
                  <button
                    type="button"
                    className={cn(
                      "pagination-page",
                      token === page && "pagination-page--active"
                    )}
                    onClick={() => goTo(token)}
                    aria-label={fa.pagination.page(token)}
                    aria-current={token === page ? "page" : undefined}
                  >
                    {token.toLocaleString("fa-IR")}
                  </button>
                </li>
              )
            )}
          </ol>

          <button
            type="button"
            className="pagination-nav"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            aria-label={fa.pagination.next}
          >
            <span>{fa.pagination.next}</span>
            <ChevronLeft size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />
          </button>
        </div>
      ) : null}
    </nav>
  );
}
