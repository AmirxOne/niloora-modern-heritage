"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectCartItems } from "@/lib/store/slices/cartSlice";
import {
  applyGiftCard,
  clearGiftCard,
  selectGiftCardApplied,
  selectGiftCardAppliedCode,
  selectGiftCardHydrated,
  setGiftCardError,
} from "@/lib/store/slices/giftCardSlice";
import { parseJsonResponse } from "./fetch-utils";

export function useGiftCardBootstrap() {
  const dispatch = useAppDispatch();
  const appliedCode = useAppSelector(selectGiftCardAppliedCode);
  const applied = useAppSelector(selectGiftCardApplied);
  const hydrated = useAppSelector(selectGiftCardHydrated);
  const items = useAppSelector(selectCartItems);
  const lastPayableRef = useRef<number | null>(null);

  const payableBeforeGiftCard = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!hydrated) return;
    if (payableBeforeGiftCard <= 0 && appliedCode) {
      dispatch(clearGiftCard());
      return;
    }
    if (!appliedCode) return;
    if (applied && lastPayableRef.current === payableBeforeGiftCard) return;
    lastPayableRef.current = payableBeforeGiftCard;
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCode, payable: payableBeforeGiftCard }),
      });
      if (cancelled) return;
      if (!response.ok) {
        dispatch(setGiftCardError("unknown"));
        dispatch(clearGiftCard());
        return;
      }
      const data = await parseJsonResponse<
        | {
            valid: true;
            appliedAmount: number;
            payableAfter: number;
            giftCard: { code: string; remainingAmount: number };
          }
        | { valid: false; reason: "not_found" | "inactive" | "expired" | "empty" }
      >(response);
      if (!data) return;
      if (!data.valid) {
        dispatch(setGiftCardError(data.reason));
        dispatch(clearGiftCard());
        return;
      }
      dispatch(
        applyGiftCard({
          code: data.giftCard.code,
          appliedAmount: data.appliedAmount,
          remainingAmount: data.giftCard.remainingAmount - data.appliedAmount,
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, appliedCode, applied, payableBeforeGiftCard, dispatch]);
}
