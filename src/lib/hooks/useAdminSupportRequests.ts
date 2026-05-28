"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminSupportRequest } from "@/lib/types";
import type {
  SupportRequestFilterKind,
  SupportRequestFilterStatus,
  SupportRequestStatus,
} from "@/lib/server/support-request/support-request";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminSupportRequests() {
  const auth = useAuth();
  const [requests, setRequests] = useState<AdminSupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupportRequestFilterStatus>("all");
  const [kindFilter, setKindFilter] = useState<SupportRequestFilterKind>("all");

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadRequests = useCallback(
    async (
      status: SupportRequestFilterStatus = statusFilter,
      kind: SupportRequestFilterKind = kindFilter
    ) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (kind !== "all") params.set("kind", kind);
        const query = params.toString() ? `?${params}` : "";
        const response = await fetch(`/api/admin/support-requests${query}`);
        if (response.status === 401) {
          toast.error("دسترسی مدیریت ندارید.");
          setRequests([]);
          return;
        }
        if (!response.ok) {
          toast.error("دریافت درخواست‌ها انجام نشد.");
          return;
        }
        const data = await parseJsonResponse<{ requests: AdminSupportRequest[] }>(response);
        setRequests(data?.requests ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin, statusFilter, kindFilter]
  );

  const updateRequest = useCallback(
    async (
      id: string,
      payload: { status?: SupportRequestStatus; internalNotes?: string | null }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(
          `/api/admin/support-requests/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await parseJsonResponse<{ request?: AdminSupportRequest; message?: string }>(
          response
        );
        if (!response.ok || !data?.request) {
          toast.error(data?.message ?? "ذخیره تغییرات انجام نشد.");
          return false;
        }
        setRequests((prev) => prev.map((r) => (r.id === id ? data.request! : r)));
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
    requests,
    isLoading,
    isSaving,
    statusFilter,
    setStatusFilter,
    kindFilter,
    setKindFilter,
    loadRequests,
    updateRequest,
  };
}
