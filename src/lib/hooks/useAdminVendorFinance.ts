"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client-fetch";
import { useAuth } from "@/lib/hooks/useAuth";
import type { AdminVendorFinanceDto } from "@/lib/server/marketplace/payout/admin-vendor-finance-dto";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { toast } from "sonner";

export function useAdminVendorFinance() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const [finance, setFinance] = useState<AdminVendorFinanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFinance = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/finance/vendors");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setFinance(null);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت گزارش مارکت‌پلیس انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ finance: AdminVendorFinanceDto }>(response);
      setFinance(data?.finance ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  return { isAdmin, finance, isLoading, loadFinance };
}
