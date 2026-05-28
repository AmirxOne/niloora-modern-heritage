"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminTradeInSubmission } from "@/lib/types";
import type {
  TradeInFilterStatus,
  TradeInSubmissionStatus,
} from "@/lib/server/trade-in/admin-trade-in";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminTradeIn() {
  const auth = useAuth();
  const [submissions, setSubmissions] = useState<AdminTradeInSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TradeInFilterStatus>("all");

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadSubmissions = useCallback(
    async (filter: TradeInFilterStatus = statusFilter) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
        const response = await fetch(`/api/admin/trade-in${query}`);
        if (response.status === 401) {
          toast.error("دسترسی مدیریت ندارید.");
          setSubmissions([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت درخواست‌ها انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ submissions: AdminTradeInSubmission[] }>(response);
        setSubmissions(data?.submissions ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, statusFilter]
  );

  const updateSubmission = useCallback(
    async (
      id: string,
      payload: { status?: TradeInSubmissionStatus; internalNotes?: string | null }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/trade-in/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ submission?: AdminTradeInSubmission; message?: string }>(
          response
        );
        if (!response.ok || !data?.submission) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return false;
        }
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? data.submission! : s))
        );
        toast.success("درخواست به‌روزرسانی شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    allowed,
    isAdmin,
    submissions,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    loadSubmissions,
    updateSubmission,
  };
}
