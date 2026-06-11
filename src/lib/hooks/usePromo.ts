"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { PromoCodeDefinition } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  applyPromoCode,
  clearPromoCode,
  selectAppliedPromoCode,
  selectPromoError,
  selectPromoHydrated,
  setPromoError,
} from "../store/slices/promoSlice";

type ValidateResponse =
  | { valid: true; promo: PromoCodeDefinition }
  | { valid: false; reason: "not_found" | "min_order" | "inactive" | "exhausted" };

async function validatePromoApi(code: string, subtotalSale: number): Promise<ValidateResponse> {
  const response = await fetch("/api/promo/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotalSale }),
  });
  if (!response.ok) return { valid: false, reason: "not_found" };
  return (await response.json()) as ValidateResponse;
}

export function usePromo() {
  const dispatch = useAppDispatch();
  const appliedCode = useAppSelector(selectAppliedPromoCode);
  const lastError = useAppSelector(selectPromoError);
  const hydrated = useAppSelector(selectPromoHydrated);

  const tryApply = useCallback(
    async (rawCode: string, subtotalSale: number) => {
      const trimmed = rawCode.trim();
      if (!trimmed) {
        dispatch(clearPromoCode());
        toast.info(fa.bahakahi.promoRemove);
        return { success: true as const };
      }

      const result = await validatePromoApi(trimmed, subtotalSale);
      if (!result.valid) {
        dispatch(setPromoError(result.reason));
        if (result.reason === "not_found" || result.reason === "inactive") {
          toast.error(fa.bahakahi.promoErrorNotFound);
        } else if (result.reason === "exhausted") {
          toast.error(fa.bahakahi.promoErrorExhausted);
        } else {
          toast.error(fa.bahakahi.promoErrorMinOrder);
        }
        return { success: false as const, reason: result.reason };
      }

      dispatch(applyPromoCode(result.promo));
      toast.success(fa.bahakahi.promoApplied(result.promo.code));
      return { success: true as const, promo: result.promo };
    },
    [dispatch]
  );

  const remove = useCallback(() => {
    dispatch(clearPromoCode());
    toast.info(fa.bahakahi.promoRemove);
  }, [dispatch]);

  return {
    appliedCode,
    lastError,
    hydrated,
    tryApply,
    remove,
    validatePromoApi,
  };
}
