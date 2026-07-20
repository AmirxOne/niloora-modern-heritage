"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { mergeSavedDesigns } from "@/lib/preferences/saved-designs";
import { fa } from "@/lib/i18n/fa";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/store/hooks";
import { setCartItemsFromServer } from "@/lib/store/slices/cartSlice";
import { setWishlistFromServer } from "@/lib/store/slices/wishlistSlice";
import { setCompareListFromServer } from "@/lib/store/slices/compareListSlice";
import { setRecentlyViewedFromServer } from "@/lib/store/slices/recentlyViewedSlice";
import {
  resetDesignsRemoteMerge,
  selectDesignsHydrated,
  setDesignsFromServer,
} from "@/lib/store/slices/designsSlice";
import { apiFetch } from "@/lib/api/client-fetch";
import { clearPromoCode, setPromoFromServer, setAppliedPromo } from "@/lib/store/slices/promoSlice";
import type { PromoCodeDefinition } from "@/lib/types";

type PreferencesResponse = {
  cartItems: import("@/lib/types").CartItem[];
  wishlistIds: string[];
  wishlistPriceWatch: Record<string, number>;
  savedDesigns: import("@/lib/types").SavedDesign[];
  compareProductIds: string[];
  recentlyViewedIds: string[];
  promoCode: string | null;
};

type ValidateResponse =
  | { valid: true; promo: PromoCodeDefinition }
  | { valid: false; reason: string };

export function useUserPreferencesSync(isLoggedIn: boolean) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const designsHydrated = useAppSelector(selectDesignsHydrated);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      syncedRef.current = false;
      dispatch(resetDesignsRemoteMerge());
      return;
    }

    if (!designsHydrated || syncedRef.current) return;

    let cancelled = false;
    async function sync() {
      let response: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        response = await apiFetch("/api/user/preferences").catch(() => null);
        if (response?.ok) break;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 80 * (attempt + 1)));
        }
      }
      if (!response?.ok || cancelled) return;

      const data = (await response.json()) as PreferencesResponse;
      const localDesigns = store.getState().designs.designs;
      const { designs: mergedDesigns, stats } = mergeSavedDesigns(
        localDesigns,
        data.savedDesigns ?? []
      );

      if (cancelled) return;

      const cartItems = data.cartItems ?? [];
      dispatch(setCartItemsFromServer(cartItems));
      dispatch(setWishlistFromServer(data.wishlistIds ?? []));
      dispatch(setCompareListFromServer(data.compareProductIds ?? []));
      dispatch(setRecentlyViewedFromServer(data.recentlyViewedIds ?? []));
      dispatch(setDesignsFromServer(mergedDesigns));

      if (stats.mergedFromLocal > 0) {
        toast.success(
          fa.preferences.designsMergedFromLocal(stats.mergedFromLocal)
        );
      } else if (stats.conflictsResolved > 0 || stats.duplicatesRemoved > 0) {
        toast.info(fa.preferences.designsSyncResolved);
      }

      syncedRef.current = true;

      if (!data.promoCode) {
        dispatch(setPromoFromServer(null));
        return;
      }

      dispatch(setPromoFromServer(data.promoCode));
      const subtotalSale = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const validateRes = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.promoCode, subtotalSale }),
      }).catch(() => null);
      if (cancelled) return;
      if (!validateRes?.ok) {
        dispatch(clearPromoCode());
        return;
      }
      const validated = (await validateRes.json()) as ValidateResponse;
      if (validated.valid) {
        dispatch(setAppliedPromo(validated.promo));
      } else {
        dispatch(clearPromoCode());
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isLoggedIn, designsHydrated, store]);
}
