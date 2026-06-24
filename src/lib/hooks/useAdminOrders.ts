"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminOrder } from "@/lib/types";
import type { AdminOrderFilterStatus, AdminSettableOrderStatus } from "@/lib/server/orders/admin-order";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { downloadExcelFromResponse, postExcelFile } from "@/lib/admin/excel-io";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminOrders() {
  const auth = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminOrderFilterStatus>("all");
  const [vendorIdFilter, setVendorIdFilter] = useState<string>("");

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadOrders = useCallback(
    async (
      filter: AdminOrderFilterStatus = statusFilter,
      vendorId: string = vendorIdFilter
    ) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("status", filter);
        if (vendorId.trim()) params.set("vendorId", vendorId.trim());
        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await apiFetch(`/api/admin/orders${query}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
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
    [isAdmin, statusFilter, vendorIdFilter]
  );

  const updateOrder = useCallback(
    async (
      orderId: string,
      payload: { status?: AdminSettableOrderStatus; trackingCode?: string | null }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
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

  const exportExcel = useCallback(async () => {
    if (!isAdmin) return;
    const response = await apiFetch("/api/admin/orders/csv");
    const ok = await downloadExcelFromResponse(response, "orders.xlsx");
    if (!ok) toast.error("خروجی Excel سفارش‌ها انجام نشد.");
  }, [isAdmin]);

  const importExcel = useCallback(
    async (file: File) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await postExcelFile("/api/admin/orders/csv", file);
        const data = await parseJsonResponse<{
          totalRows: number;
          updated?: number;
          failed?: number;
          errors?: Array<{ row: number; id?: string; message: string }>;
          message?: string;
        }>(response);
        if (!response.ok || !data) {
          toast.error(data?.message ?? "ورود Excel سفارش‌ها انجام نشد.");
          return null;
        }
        await loadOrders(statusFilter, vendorIdFilter);
        toast.success(
          `Excel سفارش‌ها پردازش شد: بروزرسانی ${data.updated ?? 0} · خطا ${data.failed ?? 0}`
        );
        return data;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadOrders, statusFilter, vendorIdFilter]
  );

  return {
    allowed,
    isAdmin,
    orders,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    vendorIdFilter,
    setVendorIdFilter,
    loadOrders,
    updateOrder,
    exportExcel,
    importExcel,
  };
}
