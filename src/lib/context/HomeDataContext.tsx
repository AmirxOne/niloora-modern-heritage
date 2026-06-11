"use client";

import { createContext, useContext } from "react";
import type { HomePageData } from "@/lib/server/home/get-home-page-data";
import { useHomeData } from "@/lib/hooks/useHomeData";

type HomeDataValue = ReturnType<typeof useHomeData>;

const HomeDataContext = createContext<HomeDataValue | null>(null);

export function HomeDataProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: HomePageData;
}) {
  const value = useHomeData(initialData);
  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>;
}

export function useHomeDataContext(): HomeDataValue {
  const value = useContext(HomeDataContext);
  if (!value) {
    throw new Error("useHomeDataContext must be used within HomeDataProvider");
  }
  return value;
}
