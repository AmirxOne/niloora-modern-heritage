"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CustomizerQuoteRequest, CustomizerState } from "@/lib/types";
import { useAuth } from "./useAuth";

async function parseResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useQuoteRequests() {
  const auth = useAuth();
  const [quotes, setQuotes] = useState<CustomizerQuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuotes = useCallback(async () => {
    if (!auth.isLoggedIn) {
      setQuotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/customizer/quote-requests");
      if (!response.ok) {
        toast.error("دریافت درخواست‌های برآورد انجام نشد.");
        return;
      }
      const data = await parseResponse<{ quotes: CustomizerQuoteRequest[] }>(response);
      setQuotes(data?.quotes ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isLoggedIn]);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const submitQuoteRequest = useCallback(
    async (input: {
      configuration: CustomizerState;
      title?: string;
      customerNote?: string;
      estimateTotal: number;
    }): Promise<CustomizerQuoteRequest | null> => {
      if (!auth.isLoggedIn) return null;
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/customizer/quote-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await parseResponse<{ quote?: CustomizerQuoteRequest; message?: string }>(
          response
        );
        if (!response.ok || !data?.quote) {
          toast.error(data?.message ?? "ثبت درخواست برآورد انجام نشد.");
          return null;
        }
        setQuotes((prev) => [data.quote!, ...prev]);
        toast.success("درخواست برآورد کارگاه ثبت شد.");
        return data.quote;
      } finally {
        setIsSubmitting(false);
      }
    },
    [auth.isLoggedIn]
  );

  return {
    quotes,
    isLoading,
    isSubmitting,
    loadQuotes,
    submitQuoteRequest,
  };
}
