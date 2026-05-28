"use client";

import { useMemo } from "react";
import { calculateCartPricing } from "@/lib/pricing";
import { useSiteBanner } from "@/lib/hooks/useSiteBanner";
import { useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { selectCartItems } from "../store/slices/cartSlice";
import { selectAppliedPromo, selectAppliedPromoCode } from "../store/slices/promoSlice";
import { selectGiftCardApplied } from "../store/slices/giftCardSlice";
import { selectAuthUser } from "../store/slices/authSlice";
import type { BundleOfferDefinition } from "@/lib/types";
import type { PublicCampaignDto } from "@/lib/types/campaign";
import { parseJsonResponse } from "./fetch-utils";

export function useCartPricing() {
  const items = useAppSelector(selectCartItems);
  const appliedPromo = useAppSelector(selectAppliedPromo);
  const appliedPromoCode = useAppSelector(selectAppliedPromoCode);
  const giftCard = useAppSelector(selectGiftCardApplied);
  const authUser = useAppSelector(selectAuthUser);
  const { siteWideForPricing } = useSiteBanner();
  const [bundles, setBundles] = useState<BundleOfferDefinition[]>([]);
  const [campaigns, setCampaigns] = useState<PublicCampaignDto[]>([]);

  useEffect(() => {
    fetch("/api/bundles/active")
      .then((response) => (response.ok ? parseJsonResponse<{ bundles: BundleOfferDefinition[] }>(response) : null))
      .then((data) => setBundles(data?.bundles ?? []))
      .catch(() => undefined);
    fetch("/api/campaigns/active")
      .then((response) =>
        response.ok ? parseJsonResponse<{ campaigns: PublicCampaignDto[] }>(response) : null
      )
      .then((data) => setCampaigns(data?.campaigns ?? []))
      .catch(() => undefined);
  }, []);

  return useMemo(
    () =>
      calculateCartPricing(items, appliedPromo, appliedPromoCode, siteWideForPricing, bundles, {
        code: giftCard?.code ?? null,
        appliedAmount: giftCard?.appliedAmount ?? null,
      }, {
        tier: authUser?.loyaltyTier ?? undefined,
      }, campaigns),
    [items, appliedPromo, appliedPromoCode, siteWideForPricing, bundles, giftCard, authUser?.loyaltyTier, campaigns]
  );
}
