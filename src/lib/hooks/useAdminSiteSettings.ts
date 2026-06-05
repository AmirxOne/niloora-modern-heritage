"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminSiteSettings } from "@/lib/site-settings/types";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export function useAdminSiteSettings() {
  const auth = useAuth();
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadSettings = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/site-settings");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setSettings(null);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت تنظیمات انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ settings: AdminSiteSettings }>(response);
      setSettings(data?.settings ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const saveSettings = useCallback(
    async (payload: Partial<AdminSiteSettings> & Record<string, unknown>) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch("/api/admin/site-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ settings?: AdminSiteSettings; message?: string }>(
          response
        );
        if (!response.ok || !data?.settings) {
          toast.error(data?.message ?? "ذخیره تنظیمات انجام نشد.");
          return false;
        }
        setSettings(data.settings);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("site-settings-updated"));
        }
        toast.success("تنظیمات ذخیره شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return { allowed, isAdmin, settings, isLoading, isSaving, loadSettings, saveSettings };
}
