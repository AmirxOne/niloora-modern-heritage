"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminOrderReturnDetail, OrderReturnStatus } from "@/lib/types";
import type { OrderReturnItemInput } from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminReturnDetail(returnId: string) {
  const auth = useAuth();
  const [returnRequest, setReturnRequest] = useState<AdminOrderReturnDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadDetail = useCallback(async () => {
    if (!isAdmin || !returnId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/returns/${encodeURIComponent(returnId)}`);
      const data = await parseJsonResponse<{ return?: AdminOrderReturnDetail; message?: string }>(
        response
      );
      if (!response.ok || !data?.return) {
        toast.error(data?.message ?? "دریافت جزئیات مرجوعی انجام نشد.");
        setReturnRequest(null);
        return;
      }
      setReturnRequest(data.return);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, returnId]);

  const updateReturn = useCallback(
    async (payload: {
      status?: OrderReturnStatus;
      statusNote?: string | null;
      internalNotes?: string | null;
      refundableAmount?: number;
      reason?: string;
      reasonDetail?: string | null;
      items?: OrderReturnItemInput[];
    }) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/returns/${encodeURIComponent(returnId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ return?: AdminOrderReturnDetail; message?: string }>(
          response
        );
        if (!response.ok || !data?.return) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return null;
        }
        setReturnRequest(data.return);
        toast.success("مرجوعی به‌روزرسانی شد.");
        return data.return;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, returnId]
  );

  return { allowed, isAdmin, returnRequest, isLoading, isSaving, loadDetail, updateReturn };
}
