"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useAdminAccess } from "./useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "./fetch-utils";
import type { AdminGiftCardRecord, GiftCard } from "@/lib/types";

export function useAdminGiftCards() {
  const auth = useAuth();
  const [giftCards, setGiftCards] = useState<AdminGiftCardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);

  const loadGiftCards = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/gift-cards");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setGiftCards([]);
        return;
      }
      if (!response.ok) {
        toast.error("دریافت کارت‌های هدیه انجام نشد.");
        return;
      }
      const data = await parseJsonResponse<{ giftCards: AdminGiftCardRecord[] }>(response);
      setGiftCards(data?.giftCards ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const createGiftCard = useCallback(
    async (payload: { amount: number; note?: string; recipientName?: string; recipientContact?: string }) => {
      if (!isAdmin) return null;
      setIsSaving(true);
      try {
        const response = await apiFetch("/api/admin/gift-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ giftCard?: GiftCard; message?: string }>(response);
        if (!response.ok || !data?.giftCard) {
          toast.error(data?.message ?? "ثبت کارت هدیه انجام نشد.");
          return null;
        }
        toast.success("کارت هدیه ثبت شد.");
        await loadGiftCards();
        return data.giftCard;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadGiftCards]
  );

  const updateGiftCard = useCallback(
    async (id: string, payload: { active?: boolean; expiresAt?: string | null; note?: string }) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await apiFetch(`/api/admin/gift-cards/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await parseJsonResponse<{ message?: string }>(response);
          toast.error(data?.message ?? "به‌روزرسانی کارت هدیه انجام نشد.");
          return false;
        }
        toast.success("کارت هدیه به‌روزرسانی شد.");
        await loadGiftCards();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadGiftCards]
  );

  return {
    allowed,
    isAdmin,
    giftCards,
    isLoading,
    isSaving,
    loadGiftCards,
    createGiftCard,
    updateGiftCard,
  };
}
