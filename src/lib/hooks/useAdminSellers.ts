"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/i18n/fa";
import { useAuth } from "./useAuth";

const t = fa.admin.sellers;

export type AdminSellerRecord = {
  id: string;
  shopName: string;
  slug: string;
  bio: string | null;
  status: "pending" | "active" | "suspended";
  productCount: number;
  commissionPercent: number;
  createdAt: string;
  owner: { name: string; phone: string };
};

export type AdminPayoutRecord = {
  id: string;
  amount: number;
  status: "requested" | "approved" | "paid" | "rejected";
  note: string | null;
  createdAt: string;
  seller: { shopName: string; slug: string };
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useAdminSellers() {
  const auth = useAuth();
  const [sellers, setSellers] = useState<AdminSellerRecord[]>([]);
  const [payouts, setPayouts] = useState<AdminPayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = auth.user?.role === "admin";

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [sellersRes, payoutsRes] = await Promise.all([
        fetch("/api/admin/sellers"),
        fetch("/api/admin/seller-payouts"),
      ]);
      if (sellersRes.ok) {
        const data = await parseJson<{ sellers: AdminSellerRecord[] }>(sellersRes);
        setSellers(data?.sellers ?? []);
      }
      if (payoutsRes.ok) {
        const data = await parseJson<{ payouts: AdminPayoutRecord[] }>(payoutsRes);
        setPayouts(data?.payouts ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSeller = useCallback(
    async (sellerId: string, patch: { status?: string; commissionPercent?: number }) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/admin/sellers?id=${encodeURIComponent(sellerId)}`, {
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
        await load();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, load]
  );

  const payoutAction = useCallback(
    async (payoutId: string, action: "approve" | "mark_paid" | "reject", note?: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const res = await fetch("/api/admin/seller-payouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payoutId, action, note }),
        });
        const data = await parseJson<{ message?: string }>(res);
        if (!res.ok) {
          toast.error(data?.message ?? "عملیات انجام نشد.");
          return false;
        }
        toast.success("انجام شد.");
        await load();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, load]
  );

  return {
    isAdmin,
    sellers,
    payouts,
    isLoading,
    isSaving,
    load,
    updateSeller,
    payoutAction,
  };
}
