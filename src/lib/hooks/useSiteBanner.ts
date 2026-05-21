"use client";

import { useCallback, useEffect, useState } from "react";
import type { HomeBannerDto } from "@/lib/types/home-content";
import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";

const fallback = defaultHomeBannerDto();

export function useSiteBanner() {
  const [banner, setBanner] = useState<HomeBannerDto>(fallback);
  const [isLoading, setIsLoading] = useState(true);

  const loadBanner = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/home/banner");
      if (!response.ok) return;
      const data = (await response.json()) as { banner?: HomeBannerDto };
      if (data.banner) setBanner(data.banner);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBanner();
  }, [loadBanner]);

  const siteWideForPricing = {
    enabled: banner.enabled && banner.percent > 0,
    percent: banner.percent,
  };

  return { banner, isLoading, loadBanner, siteWideForPricing };
}
