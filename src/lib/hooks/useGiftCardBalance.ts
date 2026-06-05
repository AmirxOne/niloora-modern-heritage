"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { normalizeGiftCardCode } from "@/lib/gift-card/constants";
import { fa } from "@/lib/i18n/fa";

const t = fa.giftCards.toast;

export type GiftCardBalanceResult = {
  found: boolean;
  giftCard?: {
    code: string;
    initialAmount: number;
    remainingAmount: number;
    active: boolean;
    expiresAt: string | null;
    expired: boolean;
  };
};

export function useGiftCardBalance() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GiftCardBalanceResult | null>(null);

  const lookup = useCallback(async (rawCode: string) => {
    const code = normalizeGiftCardCode(rawCode);
    if (!code) {
      setResult({ found: false });
      return { found: false as const };
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/gift-cards/balance?code=${encodeURIComponent(code)}`);
      const data = (await response.json()) as GiftCardBalanceResult & { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? t.balanceError);
        return { found: false as const };
      }
      setResult(data);
      return data;
    } catch {
      toast.error(t.balanceError);
      return { found: false as const };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => setResult(null), []);

  return { isLoading, result, lookup, reset };
}
