import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

export type LoadingVariant =
  | "admin-cards"
  | "admin-rows"
  | "admin-metrics"
  | "admin-form"
  | "admin-detail"
  | "vendor-dashboard"
  | "vendor-hub"
  | "vendor-products"
  | "vendor-orders"
  | "vendor-payouts"
  | "order-cards"
  | "quote-cards"
  | "receipt"
  | "media-grid"
  | "inline"
  | "search-bar";

export interface LoadingStateProps {
  variant: LoadingVariant;
  /** Accessible label (screen readers). */
  label?: string;
  count?: number;
  className?: string;
}

function AdminCardSkeleton() {
  return (
    <article className="admin-order-card loading-admin-card">
      <header className="admin-order-card-header">
        <div className="space-y-2">
          <div className="sk h-4 w-44" />
          <div className="sk h-3 w-32" />
          <div className="sk h-3 w-56" />
        </div>
        <div className="sk h-6 w-24 rounded-full" />
      </header>
      <div className="admin-order-card-summary">
        <div className="sk h-3 w-72 max-w-full" />
      </div>
      <div className="admin-order-card-form">
        <div className="sk h-10 w-full rounded-heritage" />
        <div className="sk h-10 w-full rounded-heritage" />
        <div className="sk h-9 w-28 rounded-heritage" />
      </div>
    </article>
  );
}

function AdminRowSkeleton() {
  return (
    <li>
      <div className="admin-product-list-item loading-admin-row">
        <div className="sk h-5 w-5 shrink-0 rounded" />
        <div className="sk h-14 w-14 shrink-0 rounded-heritage" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="sk h-4 w-48 max-w-full" />
          <div className="sk h-3 w-32" />
        </div>
        <div className="sk h-6 w-20 shrink-0 rounded-full" />
      </div>
    </li>
  );
}

function AdminMetricsSkeleton() {
  return (
    <div className="admin-kpi-skeleton">
      <div className="admin-kpi-metrics-grid">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="admin-kpi-metric-card loading-kpi-metric">
            <div className="sk h-3 w-24" />
            <div className="sk mt-3 h-7 w-20" />
            <div className="sk mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="admin-kpi-chart-card loading-kpi-chart">
        <div className="sk h-4 w-40" />
        <div className="sk mt-6 h-56 w-full rounded-heritage" />
      </div>
    </div>
  );
}

function AdminFormSkeleton() {
  return (
    <div className="loading-form-sections space-y-8">
      {Array.from({ length: 3 }).map((_, sectionIdx) => (
        <section key={sectionIdx} className="admin-order-card loading-form-section p-5">
          <div className="sk h-5 w-40" />
          <div className="sk mt-2 h-3 w-64 max-w-full" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((__, fieldIdx) => (
              <div key={fieldIdx} className="sk h-10 w-full rounded-heritage" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AdminDetailSkeleton() {
  return (
    <div className="admin-detail-skeleton space-y-6">
      <div className="sk h-7 w-56 max-w-full" />
      <dl className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="sk h-3 w-24" />
            <div className="sk h-4 w-full max-w-xs" />
          </div>
        ))}
      </dl>
      <div className="admin-order-card p-5">
        <div className="sk h-4 w-32" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="sk h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <article className="order-history-card rounded-heritage-lg border border-[#F0EDE9] bg-white p-5">
      <header className="order-history-card-header">
        <div>
          <div className="sk h-4 w-40" />
          <div className="sk mt-2 h-3 w-28" />
        </div>
        <div className="sk h-6 w-24 rounded-full" />
      </header>
      <div className="order-timeline order-timeline--skeleton border-b border-[#F0EDE9] px-5 py-4 md:px-6">
        <div className="sk h-3 w-36" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 5 }).map((_, stepIdx) => (
            <div key={stepIdx} className="flex gap-3">
              <div className="sk h-3 w-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="sk h-3 w-24" />
                <div className="sk h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <ul className="order-history-items">
        {Array.from({ length: 2 }).map((_, lineIdx) => (
          <li key={lineIdx} className="order-history-line">
            <div className="sk order-history-thumb" />
            <div className="order-history-line-body">
              <div className="sk h-4 w-40" />
              <div className="sk mt-2 h-3 w-24" />
            </div>
            <div className="sk h-4 w-20" />
          </li>
        ))}
      </ul>
      <footer className="order-history-card-footer">
        <div>
          <div className="sk h-3 w-36" />
          <div className="sk mt-2 h-3 w-28" />
        </div>
        <div className="sk h-5 w-24" />
      </footer>
    </article>
  );
}

function QuoteCardSkeleton() {
  return (
    <article className="order-history-card quote-request-card rounded-heritage-lg border border-[#F0EDE9] bg-white p-5">
      <header className="order-history-card-header">
        <div>
          <div className="sk h-4 w-40" />
          <div className="sk mt-2 h-3 w-28" />
        </div>
        <div className="sk h-6 w-24 rounded-full" />
      </header>
      <div className="sk mt-4 h-5 w-56 max-w-full" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="sk h-3 w-16" />
            <div className="sk h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <div className="sk h-2 flex-1 rounded-full" />
        <div className="sk h-2 flex-1 rounded-full" />
        <div className="sk h-2 flex-1 rounded-full" />
      </div>
    </article>
  );
}

function VendorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="sk h-8 w-44" />
        <div className="flex gap-2">
          <div className="sk h-11 w-36 rounded-heritage" />
          <div className="sk h-11 w-36 rounded-heritage" />
        </div>
      </div>
      <div className="rounded-heritage border border-subtle bg-matte-elevated p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="sk h-6 w-52" />
            <div className="sk h-4 w-32" />
          </div>
          <div className="sk h-7 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-heritage border border-subtle bg-matte-elevated p-5">
            <div className="sk h-3 w-24" />
            <div className="sk mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorHubSkeleton() {
  return (
    <div className="space-y-6">
      <div className="sk h-8 w-44" />
      <div className="sk h-4 w-[36rem] max-w-full" />
      <div className="rounded-heritage border border-subtle bg-matte-elevated p-5">
        <div className="space-y-2">
          <div className="sk h-5 w-52" />
          <div className="sk h-4 w-full" />
          <div className="sk h-4 w-3/4" />
        </div>
        <div className="sk mt-4 h-11 w-44 rounded-heritage" />
      </div>
      <div className="rounded-heritage border border-subtle bg-matte-elevated p-5">
        <div className="sk h-5 w-40" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="sk h-11 w-full rounded-heritage" />
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="sk h-8 w-36" />
        <div className="flex gap-2">
          <div className="sk h-11 w-32 rounded-heritage" />
          <div className="sk h-11 w-32 rounded-heritage" />
          <div className="sk h-11 w-32 rounded-heritage" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 rounded-heritage border border-subtle bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="sk h-20 w-20 shrink-0 rounded-heritage" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="sk h-4 w-48 max-w-full" />
              <div className="sk h-3 w-24" />
              <div className="sk h-3 w-32" />
            </div>
            <div className="flex gap-2">
              <div className="sk h-9 w-24 rounded-heritage" />
              <div className="sk h-9 w-28 rounded-heritage" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="sk h-8 w-36" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-heritage border border-subtle bg-matte-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-subtle pb-3">
              <div className="space-y-2">
                <div className="sk h-3 w-20" />
                <div className="sk h-4 w-40" />
              </div>
              <div className="space-y-2">
                <div className="sk h-3 w-16" />
                <div className="sk h-4 w-24" />
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((__, statIdx) => (
                <div key={statIdx} className="space-y-2">
                  <div className="sk h-3 w-20" />
                  <div className="sk h-4 w-24" />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-subtle pt-3">
              <div className="sk h-4 w-full" />
              <div className="sk h-4 w-10/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorPayoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="sk h-8 w-36" />
      <div className="rounded-heritage border border-gold/20 bg-gold/5 p-5">
        <div className="sk h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-heritage border border-subtle bg-matte-elevated p-5">
            <div className="sk h-3 w-24" />
            <div className="sk mt-2 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-heritage border border-subtle">
        <div className="border-b border-subtle p-3">
          <div className="sk h-4 w-full" />
        </div>
        <div className="space-y-3 p-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="sk h-10 w-full rounded-heritage" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="order-receipt-skeleton heritage-frame mx-auto max-w-3xl p-6 md:p-10">
      <div className="sk mx-auto h-8 w-48" />
      <div className="sk mx-auto mt-3 h-3 w-32" />
      <div className="mt-8 space-y-3 border-b border-gold/10 pb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex justify-between gap-4">
            <div className="sk h-3 w-24" />
            <div className="sk h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 border-b border-gold/5 pb-4">
            <div className="sk h-16 w-16 shrink-0 rounded-heritage" />
            <div className="flex-1 space-y-2">
              <div className="sk h-4 w-40" />
              <div className="sk h-3 w-24" />
            </div>
            <div className="sk h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-between border-t border-gold/10 pt-6">
        <div className="sk h-4 w-28" />
        <div className="sk h-6 w-32" />
      </div>
    </div>
  );
}

function MediaGridSkeleton({ count }: { count: number }) {
  return (
    <div className="loading-media-grid" aria-hidden>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="sk aspect-square w-full rounded-heritage" />
      ))}
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return <span className={cn("loading-spinner", className)} aria-hidden />;
}

export function LoadingState({ variant, label, count = 3, className }: LoadingStateProps) {
  const ariaLabel = label ?? fa.common.loadingAria;

  if (variant === "inline") {
    return (
      <div
        className={cn("loading-inline", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={ariaLabel}
      >
        <div className="w-full max-w-sm space-y-2" aria-hidden>
          <div className="sk h-4 w-40 rounded" />
          <div className="sk h-3 w-full rounded" />
        </div>
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  if (variant === "search-bar") {
    return (
      <div
        className={cn("loading-search-bar", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={ariaLabel}
      >
        <div className="loading-search-bar-track">
          <div className="loading-search-bar-shine sk" />
        </div>
      </div>
    );
  }

  const body = (() => {
    switch (variant) {
      case "admin-cards":
        return (
          <div className="admin-orders-list">
            {Array.from({ length: count }).map((_, idx) => (
              <AdminCardSkeleton key={idx} />
            ))}
          </div>
        );
      case "admin-rows":
        return (
          <ul className="admin-products-list">
            {Array.from({ length: count }).map((_, idx) => (
              <AdminRowSkeleton key={idx} />
            ))}
          </ul>
        );
      case "admin-metrics":
        return <AdminMetricsSkeleton />;
      case "admin-form":
        return <AdminFormSkeleton />;
      case "admin-detail":
        return <AdminDetailSkeleton />;
      case "vendor-dashboard":
        return <VendorDashboardSkeleton />;
      case "vendor-hub":
        return <VendorHubSkeleton />;
      case "vendor-products":
        return <VendorProductsSkeleton />;
      case "vendor-orders":
        return <VendorOrdersSkeleton />;
      case "vendor-payouts":
        return <VendorPayoutsSkeleton />;
      case "order-cards":
        return (
          <div className="order-history-list space-y-5">
            {Array.from({ length: count }).map((_, idx) => (
              <OrderCardSkeleton key={idx} />
            ))}
          </div>
        );
      case "quote-cards":
        return (
          <div className="order-history-list space-y-5">
            {Array.from({ length: count }).map((_, idx) => (
              <QuoteCardSkeleton key={idx} />
            ))}
          </div>
        );
      case "receipt":
        return <ReceiptSkeleton />;
      case "media-grid":
        return <MediaGridSkeleton count={count} />;
      default:
        return null;
    }
  })();

  return (
    <div
      className={cn("loading-state", `loading-state--${variant}`, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {body}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
