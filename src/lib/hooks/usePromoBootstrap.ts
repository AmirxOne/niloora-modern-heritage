"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectCartItems } from "@/lib/store/slices/cartSlice";
import {
  clearPromoCode,
  selectAppliedPromo,
  selectAppliedPromoCode,
  selectPromoHydrated,
  setAppliedPromo,
  setPromoError,
} from "@/lib/store/slices/promoSlice";
import { usePromo } from "./usePromo";

/** Re-validates persisted promo code against DB after hydrate or cart subtotal change. */
export function usePromoBootstrap() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const appliedCode = useAppSelector(selectAppliedPromoCode);
  const appliedPromo = useAppSelector(selectAppliedPromo);
  const hydrated = useAppSelector(selectPromoHydrated);
  const { validatePromoApi } = usePromo();
  const lastSubtotalRef = useRef<number | null>(null);

  const subtotalSale = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!hydrated || !appliedCode) return;

    if (appliedPromo && subtotalSale >= appliedPromo.minSubtotal) {
      lastSubtotalRef.current = subtotalSale;
      return;
    }

    if (lastSubtotalRef.current === subtotalSale && appliedPromo) return;
    lastSubtotalRef.current = subtotalSale;

    let cancelled = false;
    void (async () => {
      const result = await validatePromoApi(appliedCode, subtotalSale);
      if (cancelled) return;
      if (result.valid) {
        dispatch(setAppliedPromo(result.promo));
        return;
      }
      dispatch(setPromoError(result.reason));
      dispatch(clearPromoCode());
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, appliedCode, appliedPromo, subtotalSale, dispatch, validatePromoApi]);
}
