"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client-fetch";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { fa } from "@/lib/i18n/fa";
import type { CustomerOrderReturn, OrderReturnItemInput } from "@/lib/types";

const t = fa.orderReturns.toast;

export type SubmitOrderReturnInput = {
  orderId: string;
  reason: string;
  reasonDetail?: string;
  refundableAmount?: number;
  items: OrderReturnItemInput[];
  message?: string;
};

export function useOrderReturns(orderId: string) {
  const [returns, setReturns] = useState<CustomerOrderReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/returns?orderId=${encodeURIComponent(orderId)}`);
      const data = await parseJsonResponse<{ returns?: CustomerOrderReturn[] }>(response);
      if (!response.ok) {
        setReturns([]);
        return;
      }
      setReturns(data?.returns ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const submit = useCallback(
    async (input: SubmitOrderReturnInput) => {
      if (!input.items.length) {
        toast.error(t.selectItems);
        return null;
      }
      setIsSubmitting(true);
      try {
        const response = await apiFetch("/api/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await parseJsonResponse<{
          return?: CustomerOrderReturn;
          supportRequestId?: string;
          message?: string;
        }>(response);
        if (!response.ok || !data?.return) {
          toast.error(data?.message ?? t.submitError);
          return null;
        }
        setReturns((prev) => [data.return!, ...prev]);
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { returns, isLoading, isSubmitting, load, submit };
}
