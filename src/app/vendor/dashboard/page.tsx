"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VendorStatusBadge } from "@/components/vendor/VendorStatusBadge";
import {
  VendorCard,
  VendorLinkButton,
  VendorPageHeader,
} from "@/components/vendor/VendorShell";
import { publicationStatusLabel } from "@/lib/vendor/labels";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import type { VendorDashboardDto } from "@/lib/server/vendor/vendor-dashboard-service";

export default function VendorDashboardPage() {
  const [dashboard, setDashboard] = useState<VendorDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vendor/dashboard", { credentials: "include" });
      const data = (await response.json()) as { dashboard?: VendorDashboardDto };
      setDashboard(data.dashboard ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/vendor/submit", { method: "POST", credentials: "include" });
      await loadDashboard();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-silver">{fa.vendor.loading}</p>;

  const vendor = dashboard?.vendor ?? null;

  if (!vendor) {
    return (
      <section className="space-y-6">
        <VendorPageHeader title={fa.vendor.dashboardTitle} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.dashboardNoVendor}</p>
          <div className="mt-4">
            <VendorLinkButton href="/vendor/apply">{fa.vendor.dashboardApplyCta}</VendorLinkButton>
          </div>
        </VendorCard>
      </section>
    );
  }

  const products = dashboard?.products;
  const quota = dashboard?.quota;
  const recentOrders = dashboard?.orders.recent ?? [];

  return (
    <section className="space-y-8 pb-12">
      <VendorPageHeader
        title={fa.vendor.dashboardTitle}
        action={
          vendor.status === "active" ? (
            <VendorLinkButton href="/vendor/products">{fa.vendor.dashboardViewProducts}</VendorLinkButton>
          ) : null
        }
      />

      <VendorCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ivory">{vendor.displayNameFa ?? vendor.displayName}</h2>
          <p className="mt-1 text-sm text-silver" dir="ltr">
            /{vendor.slug}
          </p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </VendorCard>

      {vendor.status === "rejected" && vendor.rejectionReason ? (
        <VendorCard className="border-red-200 bg-red-50/50">
          <p className="text-sm font-medium text-red-800">{fa.vendor.rejectionReason}</p>
          <p className="mt-2 text-sm text-red-700">{vendor.rejectionReason}</p>
        </VendorCard>
      ) : null}

      {(vendor.status === "draft" || vendor.status === "rejected") && (
        <VendorCard>
          <p className="text-sm text-silver">{fa.vendor.dashboardSubmitReviewHint}</p>
          <Button
            type="button"
            className="mt-4"
            isLoading={submitting}
            onClick={submitApplication}
          >
            {fa.vendor.dashboardSubmitReview}
          </Button>
        </VendorCard>
      )}

      {vendor.status === "active" && products && quota ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={fa.vendor.dashboardProductCount} value={String(products.total)} />
            <StatCard label={publicationStatusLabel("draft")} value={String(products.draft)} />
            <StatCard
              label={publicationStatusLabel("pending_review")}
              value={String(products.pending_review)}
            />
            <StatCard label={publicationStatusLabel("published")} value={String(products.published)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <VendorCard>
              <h3 className="font-semibold text-ivory">{fa.vendor.dashboardQuota}</h3>
              <dl className="mt-3 grid gap-2 text-sm text-silver sm:grid-cols-2">
                <div>
                  <dt>{fa.vendor.dashboardQuotaActive}</dt>
                  <dd className="font-medium text-ivory">
                    {quota.published} / {quota.maxActiveProducts}
                  </dd>
                </div>
                <div>
                  <dt>{fa.vendor.dashboardQuotaPending}</dt>
                  <dd className="font-medium text-ivory">
                    {quota.pending} / {quota.maxPendingSubmissions}
                  </dd>
                </div>
              </dl>
              {quota.atCreateLimit ? (
                <p className="mt-3 text-xs text-amber-800">{fa.vendor.dashboardAtCreateLimit}</p>
              ) : null}
              {quota.atSubmitLimit ? (
                <p className="mt-1 text-xs text-amber-800">{fa.vendor.dashboardAtSubmitLimit}</p>
              ) : null}
            </VendorCard>

            <VendorCard>
              <h3 className="font-semibold text-ivory">{fa.vendor.dashboardRevenue30d}</h3>
              <p className="mt-3 font-display text-2xl text-ivory">
                {formatPrice(dashboard?.revenue.gross30d ?? 0)}
              </p>
              <p className="mt-2 text-xs text-silver">
                {fa.vendor.dashboardOrders30d(dashboard?.orders.count30d ?? 0)}
              </p>
            </VendorCard>

            <VendorCard>
              <h3 className="font-semibold text-ivory">{fa.vendor.dashboardPendingPayout}</h3>
              <p className="mt-3 font-display text-2xl text-ivory">
                {formatPrice(dashboard?.revenue.pendingPayout ?? 0)}
              </p>
              <p className="mt-2 text-xs text-silver">
                {fa.vendor.dashboardPaidTotal}: {formatPrice(dashboard?.revenue.paidTotal ?? 0)}
              </p>
            </VendorCard>
          </div>
        </>
      ) : null}

      {vendor.status === "active" && recentOrders.length > 0 ? (
        <VendorCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ivory">{fa.vendor.dashboardRecentOrders}</h3>
            <Link href="/vendor/orders" className="text-sm text-gold-dark underline">
              {fa.vendor.dashboardViewAllOrders}
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentOrders.map((line) => (
              <li key={line.orderItemId} className="flex justify-between gap-4 text-silver">
                <span>
                  {line.name} × {line.quantity.toLocaleString("fa-IR")}
                </span>
                <span dir="ltr">{line.orderId}</span>
              </li>
            ))}
          </ul>
        </VendorCard>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <VendorCard>
      <dt className="text-xs text-silver">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-ivory">{value}</dd>
    </VendorCard>
  );
}
