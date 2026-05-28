"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextBox, SelectBox } from "@/components/inputs";
import { useAdminBackInStockAlerts } from "@/lib/hooks/useAdminBackInStockAlerts";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";
import type { BackInStockAlertStatus } from "@/lib/types";

const statusOptions: Array<{ value: "all" | BackInStockAlertStatus; label: string }> = [
  { value: "all", label: fa.admin.backInStockAlerts.statusAll },
  { value: "pending", label: fa.admin.backInStockAlerts.status.pending },
  { value: "sent", label: fa.admin.backInStockAlerts.status.sent },
  { value: "failed", label: fa.admin.backInStockAlerts.status.failed },
  { value: "cancelled", label: fa.admin.backInStockAlerts.status.cancelled },
];

const statusVariant: Record<BackInStockAlertStatus, "gold" | "turquoise" | "default"> = {
  pending: "gold",
  sent: "turquoise",
  failed: "default",
  cancelled: "default",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminBackInStockAlertsPanel() {
  const admin = useAdminBackInStockAlerts();
  const {
    allowed,
    isAdmin,
    statusFilter,
    search,
    isLoading,
    isSaving,
    alerts,
    setSearch,
    setStatusFilter,
    loadAlerts,
    notifySelected,
  } = admin;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      void loadAlerts();
    }
  }, [isAdmin, statusFilter, loadAlerts]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleSelection(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleNotifySelected() {
    const ok = await notifySelected(selectedIds);
    if (ok) {
      setSelectedIds([]);
      await loadAlerts();
    }
  }

  if (!allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar flex-wrap">
        <TextBox
          label={fa.admin.backInStockAlerts.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <SelectBox
          label={fa.admin.backInStockAlerts.statusFilter}
          value={statusFilter}
          options={statusOptions}
          onValueChange={(value) => setStatusFilter(value as "all" | BackInStockAlertStatus)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => void loadAlerts()}
        >
          {fa.admin.backInStockAlerts.refresh}
        </Button>
        <Button
          type="button"
          variant="turquoise"
          disabled={selectedIds.length === 0 || isSaving}
          onClick={() => void handleNotifySelected()}
        >
          {fa.admin.backInStockAlerts.notifySelected}
        </Button>
      </div>

      {selectedIds.length > 0 ? (
        <p className="text-xs text-gold-dark">{fa.admin.backInStockAlerts.selectedCount(selectedIds.length)}</p>
      ) : null}

      {isLoading ? (
        <LoadingState variant="admin-cards" count={4} />
      ) : alerts.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.backInStockAlerts.empty}</p>
      ) : (
        <ul className="admin-products-list">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <div className="admin-product-list-item">
                <label className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(alert.id)}
                    onChange={() => toggleSelection(alert.id)}
                  />
                </label>
                <div className="admin-product-list-thumb">
                  {alert.productImage ? (
                    <Image
                      src={alert.productImage}
                      alt={alert.productNamePersian ?? alert.productName ?? alert.productId}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="admin-product-list-body">
                  <p className="admin-product-list-name">
                    {alert.productNamePersian ?? alert.productName ?? alert.productId}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.contact}: {alert.contact}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.customerName}: {alert.name ?? "—"}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.requestDate}: {formatDate(alert.requestedAt)}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.notifyDate}: {formatDate(alert.notifiedAt)}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.attempts}: {alert.notifyAttempts.toLocaleString("fa-IR")}
                  </p>
                  <p className="admin-product-list-meta">
                    {fa.admin.backInStockAlerts.lastError}: {alert.lastError ?? fa.admin.backInStockAlerts.noError}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="royal">
                    {alert.channel === "sms"
                      ? fa.admin.backInStockAlerts.channel.sms
                      : fa.admin.backInStockAlerts.channel.email}
                  </Badge>
                  <Badge variant={statusVariant[alert.status]}>
                    {fa.admin.backInStockAlerts.status[alert.status]}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
