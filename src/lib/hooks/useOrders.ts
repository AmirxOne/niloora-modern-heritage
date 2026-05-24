"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CartItem, Order } from "../types";
import { useAuth } from "./useAuth";
import { useAppDispatch } from "../store/hooks";
import { incrementProductSalesFromItems } from "../store/slices/productSalesSlice";
import type { CheckoutPaymentMethod } from "@/lib/types";
import { parseJsonResponse } from "./fetch-utils";
import { trackFunnelEvent } from "@/lib/analytics/client";

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
      const data = await parseJsonResponse<{ orders: Order[] }>(response);
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
      extras: {
        promoCode?: string | null;
        giftCardCode?: string | null;
        paymentMethod?: CheckoutPaymentMethod;
        installmentMonths?: number | null;
        shipping: CheckoutShippingInput;
      }
    ): Promise<{ ok: boolean; redirectUrl?: string; bnpl?: { months?: number; amount?: number; total?: number } }> => {
      const response = await fetch("/api/payments/zarinpal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          promoCode: extras.promoCode ?? null,
          giftCardCode: extras.giftCardCode ?? null,
          paymentMethod: extras.paymentMethod ?? "zarinpal",
          installmentMonths: extras.installmentMonths ?? null,
          shipping: extras.shipping,
        }),
      });
      const data = await parseJsonResponse<{
        redirectUrl?: string;
        message?: string;
        bnpl?: { months?: number; amount?: number; total?: number };
      }>(response);
      if (!response.ok) {
        const errBody = data as { message?: string } | null;
        toast.error(errBody?.message ?? "اتصال به درگاه پرداخت ناموفق بود.");
        return { ok: false };
      }
      if (data?.redirectUrl) return { ok: true, redirectUrl: data.redirectUrl };
      if (data?.bnpl) return { ok: true, bnpl: data.bnpl };
      return { ok: false };
    },
    []
  );

  const completePaidOrder = useCallback(
    async (items: CartItem[]) => {
      void trackFunnelEvent({
        event_name: "purchase",
        value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items: items.map((item) => ({
          item_id: item.productId ?? item.id,
          item_name: item.name,
          item_category: item.availability,
          price: item.price,
          quantity: item.quantity,
        })),
        metadata: { source: "orders.completePaidOrder" },
      });
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
