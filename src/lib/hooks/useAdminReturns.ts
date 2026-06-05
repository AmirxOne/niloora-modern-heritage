"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  AdminOrderReturn,
  AdminOrderReturnDetail,
  AdminReturnsPagination,
  OrderReturnStatus,
} from "@/lib/types";
import type { OrderReturnItemInput } from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminReturns() {
  const auth = useAuth();
  const [returns, setReturns] = useState<AdminOrderReturn[]>([]);
  const [pagination, setPagination] = useState<AdminReturnsPagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<OrderReturnStatus | "all">("all");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadReturns = useCallback(
    async (opts?: {
      status?: OrderReturnStatus | "all";
      orderId?: string;
      page?: number;
      pageSize?: number;
    }) => {
      if (!isAdmin) return;
      const status = opts?.status ?? statusFilter;
      const orderId = opts?.orderId ?? orderIdFilter;
      const page = opts?.page ?? pagination.page;
      const pageSize = opts?.pageSize ?? pagination.pageSize;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (orderId.trim()) params.set("orderId", orderId.trim());
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));

        const response = await apiFetch(`/api/admin/returns?${params.toString()}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setReturns([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت لیست مرجوعی‌ها انجام نشد.");
          return;
        }

        const data = await parseJsonResponse<{
          returns: AdminOrderReturn[];
          pagination: AdminReturnsPagination;
        }>(response);
        setReturns(data?.returns ?? []);
        if (data?.pagination) setPagination(data.pagination);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, orderIdFilter, pagination.page, pagination.pageSize, statusFilter]
  );

  const updateReturn = useCallback(
    async (
      returnId: string,
      payload: {
        status?: OrderReturnStatus;
        statusNote?: string | null;
        internalNotes?: string | null;
        refundableAmount?: number;
        reason?: string;
        reasonDetail?: string | null;
        items?: OrderReturnItemInput[];
      }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/returns/${encodeURIComponent(returnId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ return?: AdminOrderReturnDetail; message?: string }>(
          response
        );
        if (!response.ok || !data?.return) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return false;
        }
        setReturns((prev) =>
          prev.map((row) => (row.id === returnId ? { ...row, ...data.return! } : row))
        );
        toast.success("مرجوعی به‌روزرسانی شد.");
        return data.return;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    allowed,
    isAdmin,
    returns,
    pagination,
    statusFilter,
    setStatusFilter,
    orderIdFilter,
    setOrderIdFilter,
    isLoading,
    isSaving,
    loadReturns,
    updateReturn,
    setPagination,
  };
}
