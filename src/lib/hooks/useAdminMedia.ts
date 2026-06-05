"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { fa } from "@/lib/i18n/fa";
import type { AdminMediaCategory } from "@/lib/media/categories";

const t = fa.admin.media.toast;

export type AdminMediaAsset = {
  id: string;
  category: AdminMediaCategory;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  url: string;
  webpUrl?: string;
  createdAt: string;
};

export function useAdminMedia() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(
    async (category?: string) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = category ? `?category=${encodeURIComponent(category)}` : "";
        const response = await apiFetch(`/api/admin/media${query}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setAssets([]);
          return;
        }
        if (!response.ok) {
          toast.error(t.loadError);
          return;
        }
        const data = await parseJsonResponse<{ assets?: AdminMediaAsset[] }>(response);
        setAssets(data?.assets ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  const upload = useCallback(
    async (file: File, category: AdminMediaCategory) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("category", category);
        const response = await apiFetch("/api/admin/media", { method: "POST", body: form });
        const data = await parseJsonResponse<{ asset?: AdminMediaAsset; message?: string }>(response);
        if (!response.ok || !data?.asset) {
          toast.error(data?.message ?? t.uploadError);
          return null;
        }
        setAssets((prev) => [data.asset!, ...prev]);
        toast.success(t.uploadSuccess);
        return data.asset;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok) {
          toast.error(t.deleteError);
          return false;
        }
        setAssets((prev) => prev.filter((item) => item.id !== id));
        toast.success(t.deleteSuccess);
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return { allowed, isAdmin, assets, isLoading, isSaving, load, upload, remove };
}
