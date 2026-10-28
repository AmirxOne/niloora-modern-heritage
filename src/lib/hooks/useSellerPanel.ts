"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import type { Product } from "@/lib/types";
import { useAuth } from "./useAuth";

const t = fa.sellerPanel;

export type SellerOverview = {
  seller: {
    id: string;
    shopName: string;
    slug: string;
    bio: string | null;
    logoUrl: string | null;
    status: "pending" | "active" | "suspended";
    productCount: number;
    createdAt: string;
  };
  stats: {
    products: number;
    soldItems: number;
    balanceToman: number;
    lifetimeCreditToman: number;
    pendingPayoutToman: number;
  };
};

export type SellerPayoutRecord = {
  id: string;
  amount: number;
  status: "requested" | "approved" | "paid" | "rejected";
  note: string | null;
  createdAt: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useSellerPanel() {
  const auth = useAuth();
  const [overview, setOverview] = useState<SellerOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [payouts, setPayouts] = useState<SellerPayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLoggedIn = auth.isLoggedIn;
  // 404 => no shop yet; 403 => shop exists but not active
  const hasShop = overview !== null;
  const shopStatus = overview?.seller.status ?? null;

  const loadAll = useCallback(async () => {
    if (!isLoggedIn) {
      setOverview(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/overview");
      if (res.status === 404) {
        setOverview(null);
        return;
      }
      if (!res.ok) return;
      const data = await parseJson<SellerOverview>(res);
      setOverview(data);

      // products + payouts only make sense for shop owners (any status —
      // but API enforces active; that's fine, pending owners see status card)
      const [prodRes, payRes] = await Promise.all([
        fetch("/api/seller/products"),
        fetch("/api/seller/payouts"),
      ]);
      if (prodRes.ok) {
        const pd = await parseJson<{ products: Product[] }>(prodRes);
        setProducts(pd?.products ?? []);
      }
      if (payRes.ok) {
        const pay = await parseJson<{ payouts: SellerPayoutRecord[] }>(payRes);
        setPayouts(pay?.payouts ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const registerShop = useCallback(
    async (input: { shopName: string; slug: string; bio?: string; phone?: string }) => {
      setIsRegistering(true);
      try {
        const res = await fetch("/api/seller/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await parseJson<{ message?: string }>(res);
        if (!res.ok) {
          toast.error(data?.message ?? "ثبت فروشگاه انجام نشد.");
          return false;
        }
        toast.success(t.registerSuccess);
        await loadAll();
        return true;
      } finally {
        setIsRegistering(false);
      }
    },
    [loadAll]
  );

  const createProduct = useCallback(
    async (input: {
      id: string;
      name: string;
      namePersian: string;
      price: number;
      stock: number;
      image: string;
      headline?: string;
    }) => {
      setIsSaving(true);
      try {
        const res = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await parseJson<{ message?: string }>(res);
        if (!res.ok) {
          toast.error(data?.message ?? "ثبت محصول انجام نشد.");
          return false;
        }
        toast.success("محصول ثبت شد.");
        await loadAll();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [loadAll]
  );

  const updateProduct = useCallback(
    async (productId: string, patch: { price?: number; stock?: number }) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/seller/products/${encodeURIComponent(productId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await parseJson<{ message?: string }>(res);
        if (!res.ok) {
          toast.error(data?.message ?? "ذخیره انجام نشد.");
          return false;
        }
        toast.success("ذخیره شد.");
        await loadAll();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [loadAll]
  );

  const requestPayout = useCallback(
    async (amount: number, note?: string) => {
      setIsSaving(true);
      try {
        const res = await fetch("/api/seller/payouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, note }),
        });
        const data = await parseJson<{ message?: string }>(res);
        if (!res.ok) {
          toast.error(data?.message ?? "درخواست تسویه انجام نشد.");
          return false;
        }
        toast.success("درخواست تسویه ثبت شد.");
        await loadAll();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [loadAll]
  );

  return {
    isLoggedIn,
    overview,
    hasShop,
    shopStatus,
    products,
    payouts,
    isLoading,
    isRegistering,
    isSaving,
    registerShop,
    createProduct,
    updateProduct,
    requestPayout,
    loadAll,
  };
}
