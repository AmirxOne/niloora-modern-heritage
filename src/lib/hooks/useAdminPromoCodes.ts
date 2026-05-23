"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AdminPromoCodeRecord } from "@/lib/server/promo/promo-code";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminPromoCodes() {
  const auth = useAuth();
  const [promoCodes, setPromoCodes] = useState<AdminPromoCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";

  const loadPromoCodes = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/promo-codes");
      if (response.status === 401) {
        toast.error("دسترسی مدیریت ندارید.");
        setPromoCodes([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت کدهای تخفیف انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ promoCodes: AdminPromoCodeRecord[] }>(response);
      setPromoCodes(data?.promoCodes ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const createPromoCode = useCallback(
    async (payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/promo-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ promoCode?: AdminPromoCodeRecord; message?: string }>(
          response
        );
        if (!response.ok || !data?.promoCode) {
          toast.error(data?.message ?? "ثبت کد انجام نشد.");
          return null;
        }
        setPromoCodes((prev) => [data.promoCode!, ...prev]);
        toast.success("کد تخفیف ثبت شد.");
        return data.promoCode;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const updatePromoCode = useCallback(
    async (id: string, payload: unknown) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/promo-codes/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ promoCode?: AdminPromoCodeRecord; message?: string }>(
          response
        );
        if (!response.ok || !data?.promoCode) {
          toast.error(data?.message ?? "ذخیره انجام نشد.");
          return null;
        }
        setPromoCodes((prev) => prev.map((p) => (p.id === id ? data.promoCode! : p)));
        toast.success("کد به‌روزرسانی شد.");
        return data.promoCode;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const deletePromoCode = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/promo-codes/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        setPromoCodes((prev) => prev.filter((p) => p.id !== id));
        toast.success("کد حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  return {
    isAdmin,
    promoCodes,
    isLoading,
    isSaving,
    loadPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
  };
}
