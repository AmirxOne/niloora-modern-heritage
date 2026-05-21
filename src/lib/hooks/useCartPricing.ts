"use client";

import { useMemo } from "react";
import { calculateCartPricing } from "@/lib/pricing";
import { useSiteBanner } from "@/lib/hooks/useSiteBanner";
import { useAppSelector } from "../store/hooks";
import { selectCartItems } from "../store/slices/cartSlice";
import { selectAppliedPromo, selectAppliedPromoCode } from "../store/slices/promoSlice";

export function useCartPricing() {
  const items = useAppSelector(selectCartItems);
  const appliedPromo = useAppSelector(selectAppliedPromo);
  const appliedPromoCode = useAppSelector(selectAppliedPromoCode);
  const { siteWideForPricing } = useSiteBanner();

  return useMemo(
    () => calculateCartPricing(items, appliedPromo, appliedPromoCode, siteWideForPricing),
    [items, appliedPromo, appliedPromoCode, siteWideForPricing]
  );
}
