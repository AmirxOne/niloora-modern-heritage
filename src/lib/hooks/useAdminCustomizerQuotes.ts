"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import type { CustomizerQuoteLiveStage, CustomizerQuoteRequest, CustomizerQuoteStatus } from "@/lib/types";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";

export type AdminCustomizerQuote = CustomizerQuoteRequest & {
  userName: string;
  userPhone: string;
};

export function useAdminCustomizerQuotes() {
  const auth = useAuth();
  const [quotes, setQuotes] = useState<AdminCustomizerQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadQuotes = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/customizer/quote-requests");
      if (isAuthDenied(response)) {
        setQuotes([]);
        toast.error("دسترسی مدیریت ندارید.");
        return;
      }
      if (!response.ok) {
        toast.error("دریافت درخواست‌های سفارشی‌سازی انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ quotes: AdminCustomizerQuote[] }>(response);
      setQuotes(data?.quotes ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const updateQuote = useCallback(
    async (
      id: string,
      payload: {
        status?: CustomizerQuoteStatus;
        liveStage?: CustomizerQuoteLiveStage;
        etaDays?: number | null;
        workshopLiveMessage?: string | null;
        workshopReply?: string | null;
        quotedTotal?: number | null;
      }
    ) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/customizer/quote-requests/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ quote?: AdminCustomizerQuote }>(response);
        if (!response.ok || !data?.quote) {
          toast.error("ذخیره تغییرات انجام نشد.");
          return false;
        }
        setQuotes((prev) => prev.map((item) => (item.id === id ? data.quote! : item)));
        toast.success("تایم‌لاین سفارشی‌سازی به‌روزرسانی شد.");
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
    quotes,
    isLoading,
    isSaving,
    loadQuotes,
    updateQuote,
  };
}
