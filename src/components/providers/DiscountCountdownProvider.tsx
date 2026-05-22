"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fallbackDiscountCountdownConfig,
  type DiscountCountdownConfig,
} from "@/lib/discounts/countdown-shared";

const DiscountCountdownContext = createContext<DiscountCountdownConfig | null>(null);

export function DiscountCountdownProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DiscountCountdownConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/discounts/countdown", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DiscountCountdownConfig | null) => {
        if (cancelled) return;
        setConfig(data ?? fallbackDiscountCountdownConfig());
      })
      .catch(() => {
        if (!cancelled) setConfig(fallbackDiscountCountdownConfig());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DiscountCountdownContext.Provider value={config}>
      {children}
    </DiscountCountdownContext.Provider>
  );
}

export function useDiscountCountdownConfig() {
  return useContext(DiscountCountdownContext);
}
