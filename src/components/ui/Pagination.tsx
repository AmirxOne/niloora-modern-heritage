"use client";

import { ChevronLeft, ChevronRight } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { getVisiblePageTokens } from "@/lib/pagination";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  from: number;
  to: number;
  className?: string;
  /** برای اسکرول بعد از تغییر صفحه */
  scrollTargetId?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  from,
  to,
  className,
  scrollTargetId,
}: PaginationProps) {
  if (totalPages <= 1 || totalItems === 0) return null;

  const tokens = getVisiblePageTokens(page, totalPages);

  const goTo = (next: number) => {
    if (next === page || next < 1 || next > totalPages) return;
    onPageChange(next);
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
      <p className="pagination-summary">
        {fa.pagination.showing(from, to, totalItems)}
      </p>

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
    </nav>
  );
}
