"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";

export type AdminAuditLogEntry = {
  id: string;
  at: string;
  action: string;
  method: string;
  route: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  payload?: string;
  actorId: string;
  actorName?: string | null;
  actorPhone?: string | null;
  actorRole?: string | null;
  ip?: string;
  userAgent?: string;
};

export function useAdminAuditLogs() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (params?: Record<string, string>) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const qs = new URLSearchParams(params ?? {});
        const response = await fetch(`/api/admin/audit-logs${qs.toString() ? `?${qs.toString()}` : ""}`);
        if (!response.ok) {
          toast.error("دریافت Audit Log انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ logs?: AdminAuditLogEntry[] }>(response);
        setLogs(data?.logs ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  return { isAdmin, logs, isLoading, load };
}
