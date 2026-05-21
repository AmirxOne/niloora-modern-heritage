"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

/** ریدایرکت پس از ورود + پاک‌سازی خطا — مشترک بین صفحات احراز هویت */
export function useAuthPage(redirectTo: string) {
  const router = useRouter();
  const { auth } = useApp();

  useEffect(() => {
    auth.clearError();
  }, [auth]);

  useEffect(() => {
    if (auth.isLoggedIn) {
      router.replace(redirectTo);
    }
  }, [auth.isLoggedIn, redirectTo, router]);

  return { auth, redirectTo };
}
