"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { AdminPaymentStatus } from "@/lib/types";
import { useAdminFinanceDetail } from "@/lib/hooks/useAdminFinanceDetail";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.finance;

const statusLabels: Record<AdminPaymentStatus, string> = {
  pending: t.status.pending,
  paid: t.status.paid,
  failed: t.status.failed,
};

const statusVariant: Record<AdminPaymentStatus, "gold" | "turquoise" | "default"> = {
  pending: "gold",
  paid: "turquoise",
  failed: "default",
};

function formatFinanceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminFinanceDetailPanel({ paymentId }: { paymentId: string }) {
  const detail = useAdminFinanceDetail(paymentId);
  const { isAdmin, loadDetail } = detail;

  useEffect(() => {
    if (isAdmin) void loadDetail();
  }, [isAdmin, loadDetail]);

  if (!detail.allowed) return null;

  if (detail.isLoading) {
    return <LoadingState variant="admin-detail" />;
  }

  if (!detail.transaction) {
    return <p className="admin-orders-empty">{t.empty}</p>;
  }

  const tx = detail.transaction;
  const status = tx.status as AdminPaymentStatus;

  return (
    <div className="admin-finance-detail-panel">
      <div className="admin-finance-detail-head">
        <Link href="/admin/finance" className="admin-order-invoice-link">
          {t.backToList}
        </Link>
        <Button type="button" variant="outline" onClick={() => void detail.loadDetail()}>
          {t.refresh}
        </Button>
      </div>

      <article className="admin-order-card">
        <header className="admin-order-card-header">
          <div>
            <p className="admin-order-id" dir="ltr">
              {tx.orderId}
            </p>
            <p className="admin-order-customer">
              {tx.customer.name} · <span dir="ltr">{tx.customer.phone}</span>
            </p>
          </div>
          <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>
        </header>

        <dl className="admin-user-detail-grid admin-finance-detail-grid">
          <div>
            <dt>{t.paymentId}</dt>
            <dd dir="ltr">{tx.id}</dd>
          </div>
          <div>
            <dt>{t.gateway}</dt>
            <dd>{tx.gateway}</dd>
          </div>
          <div>
            <dt>{t.orderTotal}</dt>
            <dd>{formatPrice(tx.orderTotal)}</dd>
          </div>
          <div>
            <dt>{t.amountRial}</dt>
            <dd dir="ltr">{tx.amountRial.toLocaleString("fa-IR")}</dd>
          </div>
          <div>
            <dt>{t.refId}</dt>
            <dd dir="ltr">{tx.refId ?? "—"}</dd>
          </div>
          <div>
            <dt>{t.authority}</dt>
            <dd dir="ltr" className="break-all">
              {tx.authority ?? "—"}
            </dd>
          </div>
          <div>
            <dt>{t.createdAt}</dt>
            <dd>{formatFinanceDate(tx.createdAt)}</dd>
          </div>
          <div>
            <dt>{t.verifiedAt}</dt>
            <dd>{tx.verifiedAt ? formatFinanceDate(tx.verifiedAt) : "—"}</dd>
          </div>
          <div>
            <dt>{t.orderStatus}</dt>
            <dd>{tx.orderStatus}</dd>
          </div>
          {tx.errorMessage ? (
            <div className="sm:col-span-2">
              <dt>خطا</dt>
              <dd className="text-silver">{tx.errorMessage}</dd>
            </div>
          ) : null}
        </dl>
      </article>

      <section className="admin-finance-detail-section">
        <h2 className="admin-finance-section-title">{t.items}</h2>
        <ul className="admin-finance-items-list">
          {tx.items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>
                {item.quantity.toLocaleString("fa-IR")} × {formatPrice(item.price)} ={" "}
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {tx.logs.length > 0 ? (
        <section className="admin-finance-detail-section">
          <h2 className="admin-finance-section-title">{t.logs}</h2>
          <ul className="admin-finance-logs-list">
            {tx.logs.map((log) => (
              <li key={log.id}>
                <span className="admin-finance-log-event">{log.event}</span>
                <span className="text-silver text-xs">{formatFinanceDate(log.createdAt)}</span>
                {log.message ? <p className="text-sm text-silver">{log.message}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
