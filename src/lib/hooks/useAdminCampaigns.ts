"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminCampaignDetailRecord, AdminCampaignRecord } from "@/lib/server/campaigns/discount-campaign";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminCampaigns() {
  const auth = useAuth();
  const [campaigns, setCampaigns] = useState<AdminCampaignRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadCampaigns = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/campaigns");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setCampaigns([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت کمپین‌ها انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ campaigns: AdminCampaignRecord[] }>(response);
      setCampaigns(data?.campaigns ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadCampaignDetail = useCallback(
    async (id: string) => {
      if (!isAdmin) return null;
      const response = await apiFetch(`/api/admin/campaigns/${encodeURIComponent(id)}`);
      if (!response.ok) {
        toast.error("دریافت جزئیات کمپین انجام نشد.");
        return null;
      }
      const data = await parseJsonResponse<{ campaign: AdminCampaignDetailRecord }>(response);
      return data?.campaign ?? null;
    },
    [isAdmin]
  );

  const createCampaign = useCallback(
    async (payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await apiFetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ campaign?: AdminCampaignRecord; message?: string }>(
          response
        );
        if (!response.ok || !data?.campaign) {
          toast.error(data?.message ?? "ثبت کمپین انجام نشد.");
          return null;
        }
        setCampaigns((prev) => [data.campaign!, ...prev]);
        toast.success("کمپین ثبت شد.");
        return data.campaign;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const updateCampaign = useCallback(
    async (id: string, payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/campaigns/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ campaign?: AdminCampaignDetailRecord; message?: string }>(
          response
        );
        if (!response.ok || !data?.campaign) {
          toast.error(data?.message ?? "ذخیره انجام نشد.");
          return null;
        }
        const { recentUsages: _recentUsages, ...record } = data.campaign;
        setCampaigns((prev) => prev.map((c) => (c.id === id ? record : c)));
        toast.success("کمپین به‌روزرسانی شد.");
        return record;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const deleteCampaign = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/campaigns/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        toast.success("کمپین حذف شد.");
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
    campaigns,
    isLoading,
    isSaving,
    loadCampaigns,
    loadCampaignDetail,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
