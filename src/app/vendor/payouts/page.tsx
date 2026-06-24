"use client";

import { useEffect, useState } from "react";
import { VendorCard, VendorPageHeader, useVendorProfile } from "@/components/vendor/VendorShell";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import type { VendorPayoutEntryDto, VendorPayoutsDto } from "@/lib/server/marketplace/payout/vendor-payout-dto";

type PayoutStatus = VendorPayoutEntryDto["status"];

const t = fa.vendor.payouts;

const statusLabels: Record<PayoutStatus, string> = {
  pending: t.statusPending,
  eligible: t.statusEligible,
  paid: t.statusPaid,
  reversed: t.statusReversed,
};

const statusVariant: Record<PayoutStatus, "gold" | "turquoise" | "default"> = {
  pending: "gold",
  eligible: "gold",
  paid: "turquoise",
  reversed: "default",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SummaryCards({ payouts }: { payouts: VendorPayoutsDto }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <VendorCard>
        <p className="text-xs text-silver">{t.pendingTotal}</p>
        <p className="mt-1 font-display text-2xl text-ivory">{formatPrice(payouts.pendingTotal)}</p>
      </VendorCard>
      <VendorCard>
        <p className="text-xs text-silver">{t.earnedTotal}</p>
        <p className="mt-1 font-display text-2xl text-ivory">{formatPrice(payouts.earnedTotal)}</p>
      </VendorCard>
      <VendorCard>
        <p className="text-xs text-silver">{t.paidTotal}</p>
        <p className="mt-1 font-display text-2xl text-ivory">{formatPrice(payouts.paidTotal)}</p>
      </VendorCard>
    </div>
  );
}

function PayoutRow({ entry }: { entry: VendorPayoutEntryDto }) {
  return (
    <tr className="border-b border-subtle/60 last:border-0">
      <td className="px-3 py-3 text-sm text-ivory" dir="ltr">
        {entry.orderId}
      </td>
      <td className="px-3 py-3 text-sm text-silver">{formatDate(entry.orderFinalizedAt ?? entry.createdAt)}</td>
      <td className="px-3 py-3 text-sm text-ivory">{formatPrice(entry.grossAmount)}</td>
      <td className="px-3 py-3 text-sm text-silver">{formatPrice(entry.commissionAmount)}</td>
      <td className="px-3 py-3 text-sm text-ivory">{formatPrice(entry.netAmount)}</td>
      <td className="px-3 py-3">
        <Badge variant={statusVariant[entry.status]}>{statusLabels[entry.status]}</Badge>
      </td>
    </tr>
  );
}

export default function VendorPayoutsPage() {
  const { vendor, loading: profileLoading } = useVendorProfile();
  const [payouts, setPayouts] = useState<VendorPayoutsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (vendor?.status !== "active") {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/vendor/payouts?page=${page}&pageSize=${pageSize}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setPayouts(data.payouts ?? null))
      .finally(() => setLoading(false));
  }, [vendor, page]);

  if (profileLoading || loading) return <p className="text-silver">{fa.vendor.loading}</p>;

  if (!vendor || vendor.status !== "active") {
    return (
      <section>
        <VendorPageHeader title={t.title} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.vendorInactive}</p>
        </VendorCard>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader title={t.title} />

      <VendorCard className="border-gold/20 bg-gold/5">
        <p className="text-sm text-silver">{t.settlementSoon}</p>
      </VendorCard>

      {payouts ? <SummaryCards payouts={payouts} /> : null}

      {payouts && payouts.entries.length === 0 ? (
        <p className="text-silver">{t.empty}</p>
      ) : payouts ? (
        <>
          <div className="overflow-x-auto rounded-heritage border border-subtle">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-subtle text-silver">
                  <th className="px-3 py-3 text-right font-medium">{t.orderId}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.date}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.gross}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.commission}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.net}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.entries.map((entry) => (
                  <PayoutRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>

          {payouts.pagination && payouts.pagination.total > 0 ? (
            <Pagination
              page={payouts.pagination.page}
              totalPages={payouts.pagination.totalPages}
              totalItems={payouts.pagination.total}
              from={
                payouts.pagination.total === 0
                  ? 0
                  : (payouts.pagination.page - 1) * payouts.pagination.pageSize + 1
              }
              to={Math.min(
                payouts.pagination.page * payouts.pagination.pageSize,
                payouts.pagination.total
              )}
              pageSize={payouts.pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={() => {}}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
