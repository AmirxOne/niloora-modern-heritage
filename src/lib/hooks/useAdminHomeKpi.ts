"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "@/lib/hooks/fetch-utils";
import type { AdminHomeKpiDto } from "@/lib/types";

export function useAdminHomeKpi() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [kpi, setKpi] = useState<AdminHomeKpiDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/home/kpi");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setKpi(null);
        return;
      }
      const data = await parseJsonResponse<{ kpi?: AdminHomeKpiDto; message?: string }>(response);
      if (!response.ok || !data?.kpi) {
        toast.error(data?.message ?? "دریافت KPI انجام نشد.");
        return;
      }
      setKpi(data.kpi);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  return {
    allowed,
    isAdmin,
    kpi,
    isLoading,
    load,
  };
}
