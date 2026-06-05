"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AuditLogEntry } from "@/lib/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminAuditLogs() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (params?: Record<string, string>) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const qs = new URLSearchParams(params ?? {});
        const response = await apiFetch(`/api/admin/audit-logs${qs.toString() ? `?${qs.toString()}` : ""}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setLogs([]);
          setTotal(0);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت گزارش فعالیت انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ logs?: AuditLogEntry[]; total?: number }>(response);
        setLogs(data?.logs ?? []);
        setTotal(data?.total ?? data?.logs?.length ?? 0);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  return { allowed, isAdmin, logs, total, isLoading, load };
}
