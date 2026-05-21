"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { selectCartItems } from "@/lib/store/slices/cartSlice";
import { selectWishlistIds } from "@/lib/store/slices/wishlistSlice";
import { selectCompareListIds } from "@/lib/store/slices/compareListSlice";
import { selectRecentlyViewedIds } from "@/lib/store/slices/recentlyViewedSlice";
import {
  selectDesignsRemoteMerged,
  selectSavedDesigns,
} from "@/lib/store/slices/designsSlice";
import { selectAppliedPromoCode } from "@/lib/store/slices/promoSlice";

export function usePersistUserPreferences(isLoggedIn: boolean) {
  const cartItems = useAppSelector(selectCartItems);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const compareProductIds = useAppSelector(selectCompareListIds);
  const recentlyViewedIds = useAppSelector(selectRecentlyViewedIds);
  const savedDesigns = useAppSelector(selectSavedDesigns);
  const designsRemoteMerged = useAppSelector(selectDesignsRemoteMerged);
  const promoCode = useAppSelector(selectAppliedPromoCode);

  useEffect(() => {
    if (!isLoggedIn || !designsRemoteMerged) return;
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          wishlistIds,
          compareProductIds,
          recentlyViewedIds,
          savedDesigns,
          promoCode,
        }),
        signal: controller.signal,
      }).catch(() => undefined);
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [
    isLoggedIn,
    designsRemoteMerged,
    cartItems,
    wishlistIds,
    compareProductIds,
    recentlyViewedIds,
    savedDesigns,
    promoCode,
  ]);
}
