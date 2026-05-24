"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import type { AdminHomeKpiDto } from "@/lib/types/home-content";

export function useAdminHomeKpi() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const [kpi, setKpi] = useState<AdminHomeKpiDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/home/kpi");
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
    isAdmin,
    kpi,
    isLoading,
    load,
  };
}
