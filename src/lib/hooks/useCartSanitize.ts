"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { sanitizeCartOnServer } from "@/lib/cart/validate-cart-client";
import { fa } from "@/lib/i18n/fa";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectCartItems,
  selectCartHydrated,
  setCartItemsFromServer,
} from "@/lib/store/slices/cartSlice";

function notifySanitizeResult(
  removedCount: number,
  adjustedCount: number
): void {
  if (removedCount > 0) {
    toast.warning(
      removedCount === 1
        ? fa.cart.sanitizeRemovedOne
        : fa.cart.sanitizeRemovedMany(removedCount)
    );
  }
  if (adjustedCount > 0) {
    toast.info(
      adjustedCount === 1
        ? fa.cart.sanitizeAdjustedOne
        : fa.cart.sanitizeAdjustedMany(adjustedCount)
    );
  }
}

export function useCartSanitize() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(selectCartHydrated);
  const items = useAppSelector(selectCartItems);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (ranRef.current) return;

    const hasCatalogLine = items.some((item) => item.productId && !item.customizerState);
    if (!hasCatalogLine) {
      ranRef.current = true;
      return;
    }

    let cancelled = false;
    ranRef.current = true;

    async function run() {
      const result = await sanitizeCartOnServer(items);
      if (cancelled) return;

      const changed =
        result.removed.length > 0 ||
        result.adjusted.length > 0 ||
        result.items.length !== items.length ||
        JSON.stringify(result.items) !== JSON.stringify(items);

      if (changed) {
        dispatch(setCartItemsFromServer(result.items));
        notifySanitizeResult(result.removed.length, result.adjusted.length);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [dispatch, hydrated, items]);
}
