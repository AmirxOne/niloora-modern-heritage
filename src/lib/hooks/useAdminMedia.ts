"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import type { AdminMediaCategory } from "@/lib/media/categories";

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
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(
    async (category?: string) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = category ? `?category=${encodeURIComponent(category)}` : "";
        const response = await fetch(`/api/admin/media${query}`);
        if (!response.ok) {
          toast.error("دریافت رسانه‌ها انجام نشد.");
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
        const response = await fetch("/api/admin/media", { method: "POST", body: form });
        const data = await parseJsonResponse<{ asset?: AdminMediaAsset; message?: string }>(response);
        if (!response.ok || !data?.asset) {
          toast.error(data?.message ?? "آپلود فایل انجام نشد.");
          return null;
        }
        setAssets((prev) => [data.asset!, ...prev]);
        toast.success("رسانه آپلود شد.");
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
        const response = await fetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok) {
          toast.error("حذف رسانه انجام نشد.");
          return false;
        }
        setAssets((prev) => prev.filter((item) => item.id !== id));
        toast.success("رسانه حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return { isAdmin, assets, isLoading, isSaving, load, upload, remove };
}
