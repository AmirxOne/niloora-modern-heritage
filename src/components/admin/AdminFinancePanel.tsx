"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { AdminFinanceTransaction, AdminPaymentStatus } from "@/lib/types";
import { useAdminFinance } from "@/lib/hooks/useAdminFinance";
import { formatPrice, formatTomanAmount } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SelectBox, TextBox } from "@/components/inputs";
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

const statusFilterOptions = [
  { value: "all", label: t.filterAll },
  { value: "paid", label: t.status.paid },
  { value: "pending", label: t.status.pending },
  { value: "failed", label: t.status.failed },
];

function formatFinanceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FinanceTransactionCard({
  tx,
  index,
}: {
  tx: AdminFinanceTransaction;
  index: number;
}) {
  const status = tx.status as AdminPaymentStatus;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card admin-finance-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id" dir="ltr">
            {tx.orderId}
          </p>
          <p className="admin-order-customer">
            {tx.customer.name} · <span dir="ltr">{tx.customer.phone}</span>
          </p>
          <p className="admin-order-date">{formatFinanceDate(tx.createdAt)}</p>
        </div>
        <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>
      </header>

      <div className="admin-order-card-summary">
        <span>
          {formatPrice(tx.orderTotal)} · {t.gateway}: {tx.gateway}
        </span>
        {tx.refId ? (
          <span className="text-xs text-silver" dir="ltr">
            {t.refId}: {tx.refId}
          </span>
        ) : null}
      </div>

      <div className="admin-finance-card-actions">
        <Link href={`/admin/finance/${tx.id}`} className="admin-order-invoice-link">
          {t.viewDetail}
        </Link>
      </div>
    </motion.article>
  );
}

function SummaryMetrics({ summary }: { summary: NonNullable<ReturnType<typeof useAdminFinance>["summary"]> }) {
  return (
    <div className="admin-finance-summary">
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.totalRevenue}</p>
        <p className="admin-kpi-metric-value">{t.toman(formatTomanAmount(summary.totalRevenue))}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.revenueToday}</p>
        <p className="admin-kpi-metric-value">{t.toman(formatTomanAmount(summary.revenueToday))}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.revenueWeek}</p>
        <p className="admin-kpi-metric-value">{t.toman(formatTomanAmount(summary.revenueWeek))}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.revenueMonth}</p>
        <p className="admin-kpi-metric-value">{t.toman(formatTomanAmount(summary.revenueMonth))}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.successfulPayments}</p>
        <p className="admin-kpi-metric-value">{summary.successfulPayments.toLocaleString("fa-IR")}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.failedPayments}</p>
        <p className="admin-kpi-metric-value">{summary.failedPayments.toLocaleString("fa-IR")}</p>
      </article>
      <article className="admin-kpi-metric-card">
        <p className="admin-kpi-metric-label">{t.averageBasket}</p>
        <p className="admin-kpi-metric-value">{t.toman(formatTomanAmount(summary.averageBasket))}</p>
      </article>
    </div>
  );
}

export function AdminFinancePanel() {
  const finance = useAdminFinance();

  useEffect(() => {
    if (finance.isAdmin) {
      void finance.loadFinance({ page: 1 });
    }
  }, [finance.isAdmin]);

  if (!finance.allowed) return null;

  return (
    <div className="admin-orders-panel admin-finance-panel">
      {finance.summary ? <SummaryMetrics summary={finance.summary} /> : null}

      <div className="admin-orders-toolbar admin-finance-toolbar">
        <SelectBox
          label={t.filterStatus}
          value={finance.filters.status}
          options={statusFilterOptions}
          onValueChange={(value) =>
            finance.setFilters((prev) => ({
              ...prev,
              status: value as AdminPaymentStatus | "all",
            }))
          }
        />
        <TextBox
          label={t.dateFrom}
          type="date"
          value={finance.filters.from}
          onChange={(e) => finance.setFilters((prev) => ({ ...prev, from: e.target.value }))}
        />
        <TextBox
          label={t.dateTo}
          type="date"
          value={finance.filters.to}
          onChange={(e) => finance.setFilters((prev) => ({ ...prev, to: e.target.value }))}
        />
        <Button
          type="button"
          disabled={finance.isLoading}
          onClick={() => void finance.loadFinance({ page: 1 })}
        >
          {t.applyFilters}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={finance.isLoading}
          onClick={() => {
            finance.setFilters({ status: "all", from: "", to: "" });
            void finance.loadFinance({ status: "all", from: "", to: "", page: 1 });
          }}
        >
          {t.clearFilters}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={finance.isLoading}
          onClick={() => void finance.loadFinance()}
        >
          {t.refresh}
        </Button>
        <Button type="button" variant="outline" onClick={() => void finance.exportExcel()}>
          {t.exportExcel}
        </Button>
      </div>

      {finance.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : finance.transactions.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {finance.transactions.map((tx, i) => (
            <FinanceTransactionCard key={tx.id} tx={tx} index={i} />
          ))}
        </div>
      )}

      {finance.pagination.total > 0 ? (
        <Pagination
          className="admin-users-pagination"
          page={finance.pagination.page}
          totalPages={finance.pagination.totalPages}
          totalItems={finance.pagination.total}
          from={
            finance.pagination.total === 0
              ? 0
              : (finance.pagination.page - 1) * finance.pagination.pageSize + 1
          }
          to={Math.min(
            finance.pagination.page * finance.pagination.pageSize,
            finance.pagination.total
          )}
          pageSize={finance.pagination.pageSize}
          onPageChange={(page) => {
            finance.setPagination((prev) => ({ ...prev, page }));
            void finance.loadFinance({ page });
          }}
          onPageSizeChange={(pageSize) => {
            finance.setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
            void finance.loadFinance({ page: 1, pageSize });
          }}
        />
      ) : null}
    </div>
  );
}
