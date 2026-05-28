"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/lib/store/hooks";
import { setAuthUser, type AuthUser } from "@/lib/store/slices/authSlice";
import { apiFetch } from "@/lib/api/client-fetch";
import { useAuth } from "@/lib/hooks/useAuth";
import { resolveAccountDisplayName } from "@/lib/account/display-name";
import type { LoyaltySummary, ReferralSummary, UserProfile } from "@/lib/types";

type AccountUser = Required<
  Pick<UserProfile, "id" | "name" | "phone" | "memberSince" | "tier">
> &
  Pick<
    UserProfile,
    | "referralCode"
    | "referralCredit"
    | "referralEarnedTotal"
    | "loyaltyPoints"
    | "loyaltyTier"
    | "loyaltyLifetimeSpend"
  > &
  Required<
    Pick<
      UserProfile,
      | "firstName"
      | "lastName"
      | "birthDate"
      | "postalCode"
      | "addressLine"
      | "province"
      | "city"
      | "nationalCode"
      | "landlinePhone"
      | "gender"
      | "favoriteStone"
      | "favoriteStyle"
      | "favoriteBudgetBand"
    >
  > &
  Pick<UserProfile, "role">;

export type AccountProfilePayload = {
  firstName: string;
  lastName: string;
  birthDate: string;
  postalCode: string;
  addressLine: string;
  province: string;
  city: string;
  nationalCode: string;
  landlinePhone: string;
  gender: "male" | "female" | "other" | "";
  favoriteStone: string;
  favoriteStyle: string;
  favoriteBudgetBand: string;
};

type AccountStats = {
  orderCount: number;
  totalSpent: number;
  wishlistCount: number;
  savedDesignsCount: number;
  cartItemsCount: number;
};

type AccountResponse = { user: AccountUser; stats: AccountStats; loyalty: LoyaltySummary };

function toAuthUser(user: AccountUser): AuthUser {
  return {
    ...user,
    name: resolveAccountDisplayName(user),
    favoriteStone: user.favoriteStone ?? undefined,
    favoriteStyle: user.favoriteStyle ?? undefined,
    favoriteBudgetBand: user.favoriteBudgetBand ?? undefined,
  };
}

export function useAccount() {
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [referral, setReferral] = useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.isLoggedIn) {
      setIsLoading(false);
      setUser(null);
      setStats(null);
      setLoyalty(null);
      setReferral(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/account", { method: "GET" });
      if (!response.ok) {
        setError("account_load_failed");
        toast.error("دریافت اطلاعات حساب انجام نشد.");
        return;
      }
      const data = (await response.json()) as AccountResponse;
      setUser(data.user);
      setStats(data.stats);
      setLoyalty(data.loyalty);
      dispatch(setAuthUser(toAuthUser(data.user)));
      try {
        const referralResponse = await apiFetch("/api/referrals/summary", { method: "GET" });
        if (referralResponse.ok) {
          const referralData = (await referralResponse.json()) as ReferralSummary;
          setReferral(referralData);
        }
      } catch {
        // Ignore referral load issues, keep account screen usable.
      }
    } catch {
      setError("account_load_failed");
      toast.error("خطا در دریافت اطلاعات حساب.");
    } finally {
      setIsLoading(false);
    }
  }, [auth.isLoggedIn, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (payload: AccountProfilePayload) => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await apiFetch("/api/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: payload.firstName || undefined,
            lastName: payload.lastName || undefined,
            birthDate: payload.birthDate || undefined,
            postalCode: payload.postalCode || undefined,
            addressLine: payload.addressLine || undefined,
            province: payload.province || undefined,
            city: payload.city || undefined,
            nationalCode: payload.nationalCode || undefined,
            landlinePhone: payload.landlinePhone || undefined,
            gender: payload.gender || undefined,
            favoriteStone: payload.favoriteStone || undefined,
            favoriteStyle: payload.favoriteStyle || undefined,
            favoriteBudgetBand: payload.favoriteBudgetBand || undefined,
          }),
        });
        if (!response.ok) {
          setError("account_save_failed");
          toast.error("ذخیره اطلاعات حساب انجام نشد.");
          return false;
        }
        const data = (await response.json()) as { user: AccountUser };
        setUser(data.user);
        dispatch(setAuthUser(toAuthUser(data.user)));
        toast.success("اطلاعات کاربری با موفقیت ذخیره شد.");
        return true;
      } catch {
        setError("account_save_failed");
        toast.error("خطا در ذخیره اطلاعات حساب.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch]
  );

  return {
    user,
    stats,
    loyalty,
    referral,
    isLoading,
    isSaving,
    error,
    updateProfile,
    reload: load,
  };
}
