"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAdminReturnDetail } from "@/lib/hooks/useAdminReturnDetail";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminReturnEditForm } from "@/components/admin/AdminReturnEditForm";
import { unifiedReturnStatusBadgeVariant } from "@/lib/returns/workflow";
import type { OrderReturnStatus } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.returns;
const statusLabels = t.status as Record<string, string>;
const reasonLabels = t.reason as Record<string, string>;

const statusVariant: Record<OrderReturnStatus, "gold" | "turquoise" | "default" | "royal"> = {
  requested: "gold",
  under_review: "royal",
  approved: "turquoise",
  rejected: "default",
  refunded: "turquoise",
  cancelled: "default",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminReturnDetailPanel({ returnId }: { returnId: string }) {
  const detail = useAdminReturnDetail(returnId);
  const { isAdmin, loadDetail } = detail;

  useEffect(() => {
    if (isAdmin) void loadDetail();
  }, [isAdmin, loadDetail]);

  if (!detail.allowed) return null;

  if (detail.isLoading) {
    return <LoadingState variant="admin-detail" />;
  }

  if (!detail.returnRequest) {
    return <p className="admin-orders-empty">{t.empty}</p>;
  }

  const row = detail.returnRequest;

  return (
    <div className="admin-finance-detail-panel">
      <div className="admin-finance-detail-head">
        <Link href="/admin/returns" className="admin-order-invoice-link">
          {t.backToList}
        </Link>
        <Link href={`/admin/orders`} className="admin-order-invoice-link" dir="ltr">
          {t.orderId}: {row.orderId}
        </Link>
        {row.supportRequestId ? (
          <Link
            href={`/admin/support-requests#support-${row.supportRequestId}`}
            className="admin-order-invoice-link"
          >
            {t.linkedSupportRequest}
          </Link>
        ) : null}
        <Button type="button" variant="outline" onClick={() => void detail.loadDetail()}>
          {t.refresh}
        </Button>
      </div>

      <article className="admin-order-card">
        <header className="admin-order-card-header">
          <div>
            <p className="admin-order-id" dir="ltr">
              {row.id}
            </p>
            <p className="admin-order-customer">
              {row.customer.name} · <span dir="ltr">{row.customer.phone}</span>
            </p>
            <p className="admin-order-date">{formatDate(row.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {row.unifiedStatus ? (
              <Badge variant={unifiedReturnStatusBadgeVariant(row.unifiedStatus)}>
                {t.unifiedStatus[row.unifiedStatus]}
              </Badge>
            ) : null}
            <Badge variant={statusVariant[row.status]}>{statusLabels[row.status]}</Badge>
          </div>
        </header>

        <div className="admin-order-card-summary flex-col items-start gap-1 px-5 py-4">
          <span>{reasonLabels[row.reason] ?? row.reason}</span>
          <span>
            {formatPrice(row.refundableAmount)} از {formatPrice(row.orderTotal)}
          </span>
        </div>

        <AdminReturnEditForm
          data={row}
          isSaving={detail.isSaving}
          onSave={async (payload) => {
            await detail.updateReturn(payload);
          }}
        />
      </article>

      <section className="admin-finance-detail-section">
        <h2 className="admin-finance-section-title">{t.historyLabel}</h2>
        {row.statusHistory.length === 0 ? (
          <p className="text-sm text-silver">—</p>
        ) : (
          <ol className="admin-return-history">
            {row.statusHistory.map((entry) => (
              <li key={entry.id}>
                <div className="admin-return-history-head">
                  <span>
                    {entry.fromStatus
                      ? `${statusLabels[entry.fromStatus] ?? entry.fromStatus} → `
                      : ""}
                    {statusLabels[entry.toStatus] ?? entry.toStatus}
                  </span>
                  <time className="text-xs text-silver">{formatDate(entry.createdAt)}</time>
                </div>
                {entry.note ? <p className="text-sm text-ivory-light">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
