"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  applyGiftCard,
  clearGiftCard,
  selectGiftCardApplied,
  selectGiftCardAppliedCode,
  selectGiftCardError,
  selectGiftCardHydrated,
  setGiftCardCode,
  setGiftCardError,
} from "@/lib/store/slices/giftCardSlice";
import { parseJsonResponse } from "./fetch-utils";

type ValidateResponse =
  | {
      valid: true;
      appliedAmount: number;
      payableAfter: number;
      giftCard: { code: string; remainingAmount: number };
    }
  | { valid: false; reason: "not_found" | "inactive" | "expired" | "empty" };

async function validateGiftCard(code: string, payable: number): Promise<ValidateResponse | null> {
  const response = await fetch("/api/gift-cards/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, payable }),
  });
  if (!response.ok) return null;
  return parseJsonResponse<ValidateResponse>(response);
}

export function useGiftCard() {
  const dispatch = useAppDispatch();
  const applied = useAppSelector(selectGiftCardApplied);
  const appliedCode = useAppSelector(selectGiftCardAppliedCode);
  const hydrated = useAppSelector(selectGiftCardHydrated);
  const error = useAppSelector(selectGiftCardError);

  const tryApply = useCallback(
    async (codeInput: string, payableBeforeGiftCard: number) => {
      const code = codeInput.trim().toUpperCase();
      if (!code) {
        dispatch(clearGiftCard());
        return { success: true as const };
      }
      dispatch(setGiftCardCode(code));
      const result = await validateGiftCard(code, payableBeforeGiftCard);
      if (!result) {
        dispatch(setGiftCardError("unknown"));
        toast.error("اعتبارسنجی کارت هدیه انجام نشد.");
        return { success: false as const };
      }
      if (!result.valid) {
        dispatch(setGiftCardError(result.reason));
        if (result.reason === "not_found") toast.error("کارت هدیه پیدا نشد.");
        if (result.reason === "inactive") toast.error("کارت هدیه غیرفعال است.");
        if (result.reason === "expired") toast.error("کارت هدیه منقضی شده است.");
        if (result.reason === "empty") toast.error("موجودی کارت هدیه کافی نیست.");
        return { success: false as const };
      }
      dispatch(
        applyGiftCard({
          code: result.giftCard.code,
          appliedAmount: result.appliedAmount,
          remainingAmount: result.giftCard.remainingAmount - result.appliedAmount,
        })
      );
      toast.success("کارت هدیه اعمال شد.");
      return { success: true as const };
    },
    [dispatch]
  );

  const remove = useCallback(() => {
    dispatch(clearGiftCard());
    toast.info("کارت هدیه حذف شد.");
  }, [dispatch]);

  return {
    applied,
    appliedCode,
    hydrated,
    error,
    tryApply,
    remove,
  };
}
