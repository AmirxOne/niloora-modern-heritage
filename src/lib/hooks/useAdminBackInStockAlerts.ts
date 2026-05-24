"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminBackInStockAlert, BackInStockAlertStatus } from "@/lib/types";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminBackInStockAlerts() {
  const auth = useAuth();
  const [alerts, setAlerts] = useState<AdminBackInStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | BackInStockAlertStatus>("all");
  const [search, setSearch] = useState("");

  const isAdmin = auth.user?.role === "admin";

  const loadAlerts = useCallback(
    async (options?: { status?: "all" | BackInStockAlertStatus; q?: string }) => {
      if (!isAdmin) return;
      const status = options?.status ?? statusFilter;
      const q = options?.q ?? search;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (q.trim()) params.set("q", q.trim());
        const query = params.toString();
        const response = await fetch(`/api/admin/back-in-stock-alerts${query ? `?${query}` : ""}`);
        if (response.status === 401) {
          toast.error("دسترسی مدیریت ندارید.");
          setAlerts([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت اعلان‌ها انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ alerts: AdminBackInStockAlert[] }>(response);
        setAlerts(data?.alerts ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, search, statusFilter]
  );

  const notifySelected = useCallback(
    async (alertIds: string[]) => {
      if (!isAdmin || alertIds.length === 0) return false;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/back-in-stock-alerts/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertIds }),
        });
        const data = await parseJsonResponse<{ sent?: number; failed?: number; message?: string }>(response);
        if (!response.ok) {
          toast.error(data?.message ?? "ارسال اعلان انجام نشد.");
          return false;
        }
        toast.success(`ارسال انجام شد — موفق: ${data?.sent ?? 0}، ناموفق: ${data?.failed ?? 0}`);
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    isAdmin,
    alerts,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    loadAlerts,
    notifySelected,
  };
}
