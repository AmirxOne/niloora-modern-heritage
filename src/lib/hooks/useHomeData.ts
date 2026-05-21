"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultHomeBannerDto } from "@/lib/home-banner-defaults";
import type { HomeBannerDto } from "@/lib/types/home-content";
import type { Product } from "@/lib/types";

type HomeCollection = {
  id: string;
  name: string;
  namePersian: string;
};

type HomeTestimonial = {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
};

type HomeInstagramPost = {
  id: string;
  image: string;
  likes: number;
};

type HomeResponse = {
  sliders: Product[];
  bestsellers: Product[];
  featuredRail: Product[];
  collections: HomeCollection[];
  testimonials: HomeTestimonial[];
  instagramPosts: HomeInstagramPost[];
  banner?: HomeBannerDto;
};

const initialState: HomeResponse = {
  sliders: [],
  bestsellers: [],
  featuredRail: [],
  collections: [],
  testimonials: [],
  instagramPosts: [],
  banner: defaultHomeBannerDto(),
};

export function useHomeData() {
  const [data, setData] = useState<HomeResponse>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/home");
      if (!response.ok) return;
      const payload = (await response.json()) as HomeResponse;
      setData({
        sliders: payload.sliders ?? [],
        bestsellers: payload.bestsellers ?? [],
        featuredRail: payload.featuredRail ?? [],
        collections: payload.collections ?? [],
        testimonials: payload.testimonials ?? [],
        instagramPosts: payload.instagramPosts ?? [],
        banner: payload.banner ?? defaultHomeBannerDto(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
