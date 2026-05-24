"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminOrder } from "@/lib/types";
import type { AdminOrderFilterStatus, AdminSettableOrderStatus } from "@/lib/server/orders/admin-order";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminOrders() {
  const auth = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminOrderFilterStatus>("all");

  const isAdmin = auth.user?.role === "admin";

  const loadOrders = useCallback(
    async (filter: AdminOrderFilterStatus = statusFilter) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
        const response = await fetch(`/api/admin/orders${query}`);
        if (response.status === 401) {
          toast.error("دسترسی مدیریت ندارید.");
          setOrders([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت سفارش‌ها انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ orders: AdminOrder[] }>(response);
        setOrders(data?.orders ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, statusFilter]
  );

  const updateOrder = useCallback(
    async (
      orderId: string,
      payload: { status?: AdminSettableOrderStatus; trackingCode?: string | null }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ order?: AdminOrder; message?: string }>(response);
        if (!response.ok || !data?.order) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return false;
        }
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order! : o)));
        toast.success("سفارش به‌روزرسانی شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const exportCsv = useCallback(async () => {
    if (!isAdmin) return;
    const response = await fetch("/api/admin/orders/csv");
    if (!response.ok) {
      toast.error("خروجی CSV سفارش‌ها انجام نشد.");
      return;
    }
    const text = await response.text();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [isAdmin]);

  const importCsv = useCallback(
    async (file: File) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const content = await file.text();
        const response = await fetch("/api/admin/orders/csv", {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: content,
        });
        const data = await parseJsonResponse<{
          totalRows: number;
          updated?: number;
          failed?: number;
          errors?: Array<{ row: number; id?: string; message: string }>;
          message?: string;
        }>(response);
        if (!response.ok || !data) {
          toast.error(data?.message ?? "ورود CSV سفارش‌ها انجام نشد.");
          return null;
        }
        await loadOrders(statusFilter);
        toast.success(
          `CSV سفارش‌ها پردازش شد: بروزرسانی ${data.updated ?? 0} · خطا ${data.failed ?? 0}`
        );
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadOrders, statusFilter]
  );

  return {
    isAdmin,
    orders,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    loadOrders,
    updateOrder,
    exportCsv,
    importCsv,
  };
}
