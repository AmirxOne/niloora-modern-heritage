"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ADMIN_ORDER_FILTER_STATUSES,
  ADMIN_ORDER_STATUSES,
  type AdminSettableOrderStatus,
} from "@/lib/server/orders/admin-order";
import { adminOrderInvoicePath } from "@/lib/orders/order-receipt";
import type { AdminOrder, Order } from "@/lib/types";
import { useAdminOrders } from "@/lib/hooks/useAdminOrders";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextBox } from "@/components/inputs";
import { AdminOrderReturnsSnippet } from "@/components/admin/AdminOrderReturnsSnippet";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const statusLabels: Record<Order["status"], string> = {
  pending_payment: fa.dashboard.orderStatus.pending_payment,
  payment_failed: fa.dashboard.orderStatus.payment_failed,
  processing: fa.dashboard.orderStatus.processing,
  crafting: fa.dashboard.orderStatus.crafting,
  shipped: fa.dashboard.orderStatus.shipped,
  delivered: fa.dashboard.orderStatus.delivered,
};

const statusVariant: Record<Order["status"], "gold" | "turquoise" | "royal" | "default"> = {
  pending_payment: "gold",
  payment_failed: "default",
  processing: "royal",
  crafting: "turquoise",
  shipped: "gold",
  delivered: "default",
};

const filterOptions = ADMIN_ORDER_FILTER_STATUSES.map((value) => ({
  value,
  label:
    value === "all"
      ? fa.admin.orders.filterAll
      : statusLabels[value as Order["status"]] ?? value,
}));

const settableStatusOptions = ADMIN_ORDER_STATUSES.map((value) => ({
  value,
  label: statusLabels[value],
}));

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminOrderCard({
  order,
  index,
  isSaving,
  onSave,
}: {
  order: AdminOrder;
  index: number;
  isSaving: boolean;
  onSave: (
    orderId: string,
    payload: { status?: AdminSettableOrderStatus; trackingCode?: string | null }
  ) => Promise<boolean>;
}) {
  const canEditStatus = ADMIN_ORDER_STATUSES.includes(
    order.status as AdminSettableOrderStatus
  );
  const canEditTracking = canEditStatus || order.status === "shipped" || order.status === "delivered";
  const [status, setStatus] = useState<AdminSettableOrderStatus>(
    canEditStatus ? (order.status as AdminSettableOrderStatus) : "processing"
  );
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");

  useEffect(() => {
    setStatus(
      ADMIN_ORDER_STATUSES.includes(order.status as AdminSettableOrderStatus)
        ? (order.status as AdminSettableOrderStatus)
        : "processing"
    );
    setTrackingCode(order.trackingCode ?? "");
  }, [order.id, order.status, order.trackingCode]);

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const dirty =
    (canEditStatus && status !== order.status) ||
    (trackingCode.trim() || "") !== (order.trackingCode ?? "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{order.id}</p>
          <p className="admin-order-date">{formatOrderDate(order.date)}</p>
          <p className="admin-order-customer">
            {order.customer.name} · <span dir="ltr">{order.customer.phone}</span>
          </p>
        </div>
        <Badge variant={statusVariant[order.status]}>{statusLabels[order.status]}</Badge>
      </header>

      <div className="admin-order-card-summary">
        <span>
          {fa.admin.orders.itemsCount(itemCount)} · {formatPrice(order.total)}
        </span>
        {order.payment?.refId ? (
          <span className="text-xs text-silver" dir="ltr">
            {fa.receipt.paymentRef}: {order.payment.refId}
          </span>
        ) : null}
        <div className="admin-order-invoice-actions">
          <Link
            href={adminOrderInvoicePath(order.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-order-invoice-link"
          >
            {fa.admin.invoice.viewPrint}
          </Link>
        </div>
      </div>

      {order.shipping ? (
        <p className="admin-order-shipping text-xs text-silver">
          {order.shipping.province}، {order.shipping.city} — {order.shipping.fullName}
        </p>
      ) : null}

      <div className="admin-order-returns-wrap px-5 py-3">
        <AdminOrderReturnsSnippet returns={order.returns ?? []} />
      </div>

      <div className="admin-order-card-form">
        <SelectBox
          label={fa.admin.orders.statusLabel}
          value={canEditStatus ? status : ""}
          options={settableStatusOptions}
          placeholder={canEditStatus ? undefined : fa.admin.orders.statusLocked}
          disabled={!canEditStatus || isSaving}
          onValueChange={(value) => setStatus(value as AdminSettableOrderStatus)}
        />
        <TextBox
          label={fa.admin.orders.trackingLabel}
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          disabled={!canEditTracking || isSaving}
          inputClassName="auth-input-ltr"
          placeholder="1234567890123"
        />
        <Button
          type="button"
          size="sm"
          className="admin-order-save-btn"
          disabled={(!canEditStatus && !canEditTracking) || !dirty || isSaving}
          onClick={() =>
            void onSave(order.id, {
              ...(canEditStatus && status !== order.status ? { status } : {}),
              trackingCode: trackingCode.trim() || null,
            })
          }
        >
          {isSaving ? fa.admin.orders.saving : fa.admin.orders.save}
        </Button>
      </div>
    </motion.article>
  );
}

export function AdminOrdersPanel() {
  const admin = useAdminOrders();
  const { isAdmin, loadOrders, statusFilter } = admin;
  const [importReport, setImportReport] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      void loadOrders(statusFilter);
    }
  }, [isAdmin, loadOrders, statusFilter]);

  const sortedOrders = useMemo(
    () => [...admin.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [admin.orders]
  );

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <SelectBox
          label={fa.admin.orders.filterLabel}
          value={admin.statusFilter}
          options={filterOptions}
          onValueChange={(value) => {
            admin.setStatusFilter(value as typeof admin.statusFilter);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadOrders(admin.statusFilter)}
        >
          {fa.admin.orders.refresh}
        </Button>
        <Button type="button" variant="outline" onClick={() => void admin.exportExcel()}>
          خروجی Excel
        </Button>
        <label className="admin-file-upload-btn">
          ورود Excel
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const result = await admin.importExcel(file);
              if (result?.errors?.length) {
                setImportReport(result.errors.slice(0, 20).map((item) => `ردیف ${item.row}: ${item.message}`));
              } else {
                setImportReport([]);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {importReport.length > 0 ? (
        <div className="admin-import-report">
          {importReport.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : sortedOrders.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.orders.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {sortedOrders.map((order, i) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              index={i}
              isSaving={admin.isSaving}
              onSave={admin.updateOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
