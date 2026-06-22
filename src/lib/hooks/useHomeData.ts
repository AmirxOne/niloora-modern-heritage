"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";
import type { HomePageData } from "@/lib/server/home/get-home-page-data";

type HomeResponse = HomePageData;

const emptyHomeData = (): HomeResponse => ({
  sliders: [],
  bestsellers: [],
  featuredRail: [],
  personalized: [],
  collections: [],
  testimonials: [],
  instagramPosts: [],
  banner: defaultHomeBannerDto(),
  campaigns: [],
  popularArtisans: [],
  blogPosts: [],
});

export function useHomeData(initialData?: HomePageData) {
  const [data, setData] = useState<HomeResponse>(() => initialData ?? emptyHomeData());
  const [isLoading, setIsLoading] = useState(!initialData);

  const loadData = useCallback(async () => {
    setIsLoading((current) => current || !initialData);
    try {
      const response = await fetch("/api/home", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as HomeResponse;
      setData({
        sliders: payload.sliders ?? [],
        bestsellers: payload.bestsellers ?? [],
        featuredRail: payload.featuredRail ?? [],
        personalized: payload.personalized ?? [],
        collections: payload.collections ?? [],
        testimonials: payload.testimonials ?? [],
        instagramPosts: payload.instagramPosts ?? [],
        banner: payload.banner ?? defaultHomeBannerDto(),
        campaigns: payload.campaigns ?? [],
        popularArtisans: payload.popularArtisans ?? [],
        blogPosts: payload.blogPosts ?? [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    banner: data.banner ?? defaultHomeBannerDto(),
    isLoading,
    loadData,
  };
}
