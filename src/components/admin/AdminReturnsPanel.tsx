"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { AdminOrderReturn, OrderReturnStatus } from "@/lib/types";
import { useAdminReturns } from "@/lib/hooks/useAdminReturns";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SelectBox, TextBox } from "@/components/inputs";
import { AdminReturnEditForm } from "@/components/admin/AdminReturnEditForm";
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

const statusFilterOptions = [
  { value: "all", label: t.filterAll },
  ...(["requested", "under_review", "approved", "rejected", "refunded", "cancelled"] as const).map(
    (value) => ({ value, label: statusLabels[value] })
  ),
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminReturnCard({
  row,
  index,
  isSaving,
  onSave,
}: {
  row: AdminOrderReturn;
  index: number;
  isSaving: boolean;
  onSave: Parameters<typeof AdminReturnEditForm>[0]["onSave"];
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id" dir="ltr">
            {row.id}
          </p>
          <p className="admin-order-date">{formatDate(row.createdAt)}</p>
          <p className="admin-order-customer">
            {row.customer.name} · <span dir="ltr">{row.customer.phone}</span>
          </p>
          <p className="text-xs text-silver" dir="ltr">
            {t.orderId}: {row.orderId}
          </p>
        </div>
        <Badge variant={statusVariant[row.status]}>{statusLabels[row.status]}</Badge>
      </header>

      <div className="admin-order-card-summary flex-col items-start gap-1">
        <span className="text-xs text-gold-dark">{reasonLabels[row.reason] ?? row.reason}</span>
        <span>
          {t.refundableAmountLabel}: {formatPrice(row.refundableAmount)} / {formatPrice(row.orderTotal)}
        </span>
        {row.reasonDetail ? (
          <p className="text-sm text-ivory-light whitespace-pre-wrap">{row.reasonDetail}</p>
        ) : null}
      </div>

      <div className="admin-finance-card-actions">
        <Link href={`/admin/returns/${row.id}`} className="admin-order-invoice-link">
          {t.viewDetail}
        </Link>
      </div>

      <AdminReturnEditForm data={row} isSaving={isSaving} onSave={onSave} />
    </motion.article>
  );
}

export function AdminReturnsPanel() {
  const admin = useAdminReturns();

  useEffect(() => {
    if (admin.isAdmin) void admin.loadReturns({ page: 1 });
  }, [admin.isAdmin]);

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar flex-wrap">
        <SelectBox
          label={t.filterStatus}
          value={admin.statusFilter}
          options={statusFilterOptions}
          onValueChange={(value) =>
            admin.setStatusFilter(value as OrderReturnStatus | "all")
          }
        />
        <TextBox
          label={t.orderId}
          value={admin.orderIdFilter}
          onChange={(e) => admin.setOrderIdFilter(e.target.value)}
          inputClassName="auth-input-ltr"
          placeholder="شناسه سفارش"
        />
        <Button
          type="button"
          disabled={admin.isLoading}
          onClick={() => void admin.loadReturns({ page: 1 })}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.returns.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.returns.map((row, i) => (
            <AdminReturnCard
              key={row.id}
              row={row}
              index={i}
              isSaving={admin.isSaving}
              onSave={(payload) => admin.updateReturn(row.id, payload)}
            />
          ))}
        </div>
      )}

      {admin.pagination.total > 0 ? (
        <Pagination
          className="admin-users-pagination"
          page={admin.pagination.page}
          totalPages={admin.pagination.totalPages}
          totalItems={admin.pagination.total}
          from={(admin.pagination.page - 1) * admin.pagination.pageSize + 1}
          to={Math.min(
            admin.pagination.page * admin.pagination.pageSize,
            admin.pagination.total
          )}
          pageSize={admin.pagination.pageSize}
          onPageChange={(page) => {
            admin.setPagination((prev) => ({ ...prev, page }));
            void admin.loadReturns({ page });
          }}
          onPageSizeChange={(pageSize) => {
            admin.setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
            void admin.loadReturns({ page: 1, pageSize });
          }}
        />
      ) : null}
    </div>
  );
}
