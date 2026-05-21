"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartItem, Order } from "../types";
import { useAuth } from "./useAuth";
import { useAppDispatch } from "../store/hooks";
import { incrementProductSalesFromItems } from "../store/slices/productSalesSlice";

async function parseResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useOrders() {
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!auth.isLoggedIn) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        toast.error("دریافت سفارش‌ها انجام نشد.");
        return;
      }
      const data = await parseResponse<{ orders: Order[] }>(response);
      setOrders(data?.orders ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isLoggedIn]);

  useEffect(() => {
    setHydrated(true);
    loadOrders();
  }, [loadOrders]);

  const startZarinpalPayment = useCallback(
    async (
      items: CartItem[],
      extras: { promoCode?: string | null; shipping: CheckoutShippingInput }
    ): Promise<{ ok: boolean; redirectUrl?: string }> => {
      const response = await fetch("/api/payments/zarinpal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          promoCode: extras.promoCode ?? null,
          shipping: extras.shipping,
        }),
      });
      const data = await parseResponse<{ redirectUrl?: string; message?: string }>(response);
      if (!response.ok || !data?.redirectUrl) {
        const errBody = data as { message?: string } | null;
        toast.error(errBody?.message ?? "اتصال به درگاه پرداخت ناموفق بود.");
        return { ok: false };
      }
      return { ok: true, redirectUrl: data.redirectUrl };
    },
    []
  );

  const completePaidOrder = useCallback(
    async (items: CartItem[]) => {
      dispatch(incrementProductSalesFromItems(items));
      await loadOrders();
      toast.success("پرداخت موفق بود و سفارش ثبت شد.");
    },
    [dispatch, loadOrders]
  );

  return {
    orders,
    hydrated,
    isLoading,
    startZarinpalPayment,
    completePaidOrder,
    loadOrders,
  };
}
