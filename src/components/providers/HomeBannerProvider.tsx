"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { HomeBannerDto } from "@/lib/types/home-content";

type HomeBannerContextValue = {
  banner: HomeBannerDto;
  isLoading: boolean;
  loadBanner: () => Promise<void>;
  siteWideForPricing: {
    enabled: boolean;
    percent: number;
  };
};

const HomeBannerContext = createContext<HomeBannerContextValue | null>(null);

export function HomeBannerProvider({
  initialBanner,
  children,
}: {
  initialBanner: HomeBannerDto;
  children: React.ReactNode;
}) {
  const [banner, setBanner] = useState(initialBanner);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setBanner(initialBanner);
  }, [initialBanner]);

  const loadBanner = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/home/banner", { cache: "no-store" });
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

  return (
    <HomeBannerContext.Provider value={{ banner, isLoading, loadBanner, siteWideForPricing }}>
      {children}
    </HomeBannerContext.Provider>
  );
}

export function useHomeBannerContext(): HomeBannerContextValue {
  const value = useContext(HomeBannerContext);
  if (!value) {
    throw new Error("useHomeBannerContext must be used within HomeBannerProvider");
  }
  return value;
}
