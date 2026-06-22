"use client";

import { useHomeBannerContext } from "@/components/providers/HomeBannerProvider";

export function useSiteBanner() {
  return useHomeBannerContext();
}
