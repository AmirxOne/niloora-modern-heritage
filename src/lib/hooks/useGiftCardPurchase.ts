"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client-fetch";
import {
  GIFT_CARD_MAX_PURCHASE_AMOUNT,
  GIFT_CARD_MIN_PURCHASE_AMOUNT,
} from "@/lib/gift-card/constants";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { fa } from "@/lib/i18n/fa";

const t = fa.giftCards.toast;

export type GiftCardPurchaseInput = {
  amount: number;
  recipientName?: string;
  recipientContact?: string;
};

function clampAmount(amount: number): number | null {
  if (!Number.isFinite(amount)) return null;
  const rounded = Math.round(amount);
  if (rounded < GIFT_CARD_MIN_PURCHASE_AMOUNT || rounded > GIFT_CARD_MAX_PURCHASE_AMOUNT) return null;
  return rounded;
}

export function useGiftCardPurchase() {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchase = useCallback(async (input: GiftCardPurchaseInput) => {
    const amount = clampAmount(input.amount);
    if (!amount) {
      toast.error(t.invalidAmount);
      return { ok: false as const };
    }

    setIsPurchasing(true);
    try {
      const response = await apiFetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          recipientName: input.recipientName?.trim() || undefined,
          recipientContact: input.recipientContact?.trim() || undefined,
        }),
      });
      const data = await parseJsonResponse<{ redirectUrl?: string; message?: string }>(response);
      if (!response.ok || !data?.redirectUrl) {
        toast.error(data?.message ?? t.purchaseError);
        return { ok: false as const };
      }
      window.location.href = data.redirectUrl;
      return { ok: true as const, redirectUrl: data.redirectUrl };
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  return { isPurchasing, purchase };
}
