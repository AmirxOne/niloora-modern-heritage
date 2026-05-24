"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { BundleOfferDefinition } from "@/lib/types";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminBundles() {
  const auth = useAuth();
  const [bundles, setBundles] = useState<BundleOfferDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";

  const loadBundles = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/bundles");
      if (response.status === 401) {
        toast.error("دسترسی مدیریت ندارید.");
        setBundles([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت باندل‌ها انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ bundles: BundleOfferDefinition[] }>(response);
      setBundles(data?.bundles ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const createBundle = useCallback(
    async (payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/bundles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ bundle?: BundleOfferDefinition; message?: string }>(response);
        if (!response.ok || !data?.bundle) {
          toast.error(data?.message ?? "ثبت باندل انجام نشد.");
          return null;
        }
        setBundles((prev) => [data.bundle!, ...prev]);
        toast.success("باندل ثبت شد.");
        return data.bundle;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const updateBundle = useCallback(
    async (id: string, payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/bundles/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ bundle?: BundleOfferDefinition; message?: string }>(response);
        if (!response.ok || !data?.bundle) {
          toast.error(data?.message ?? "ذخیره باندل انجام نشد.");
          return null;
        }
        setBundles((prev) => prev.map((item) => (item.id === id ? data.bundle! : item)));
        toast.success("باندل به‌روزرسانی شد.");
        return data.bundle;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const deleteBundle = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/bundles/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف باندل انجام نشد.");
          return false;
        }
        setBundles((prev) => prev.filter((item) => item.id !== id));
        toast.success("باندل حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    isAdmin,
    bundles,
    isLoading,
    isSaving,
    loadBundles,
    createBundle,
    updateBundle,
    deleteBundle,
  };
}
