"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { setProductSales } from "@/lib/store/slices/productSalesSlice";

export function useProductSalesSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    async function loadSales() {
      const response = await fetch("/api/products/sales");
      if (!response.ok) return;
      const payload = (await response.json()) as { byProductId?: Record<string, number> };
      if (!cancelled && payload.byProductId) {
        dispatch(setProductSales(payload.byProductId));
      }
    }
    loadSales();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
