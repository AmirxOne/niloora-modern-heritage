"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminFinanceDetail } from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminFinanceDetail(paymentId: string) {
  const auth = useAuth();
  const [transaction, setTransaction] = useState<AdminFinanceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadDetail = useCallback(async () => {
    if (!isAdmin || !paymentId) return;
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/admin/finance/${encodeURIComponent(paymentId)}`);
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setTransaction(null);
        return;
      }
      const data = await parseJsonResponse<{ transaction?: AdminFinanceDetail; message?: string }>(
        response
      );
      if (!response.ok || !data?.transaction) {
        toast.error(data?.message ?? "دریافت جزئیات تراکنش انجام نشد.");
        setTransaction(null);
        return;
      }
      setTransaction(data.transaction);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, paymentId]);

  return { allowed, isAdmin, transaction, isLoading, loadDetail };
}
