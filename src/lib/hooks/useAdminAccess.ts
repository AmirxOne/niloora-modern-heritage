"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { performAccessRedirect } from "@/lib/navigation/access-redirect";
import { useAuth } from "./useAuth";

export function useAdminAccess(isAdmin: boolean) {
  const router = useRouter();
  const auth = useAuth();
  const allowed = auth.sessionResolved && auth.isLoggedIn && isAdmin;

  useEffect(() => {
    if (!auth.sessionResolved) return;

    if (!auth.isLoggedIn) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      router.replace(`/auth?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (!isAdmin) {
      const onAccountPage =
        typeof window !== "undefined" && window.location.pathname.includes("/account");
      if (onAccountPage) return;
      performAccessRedirect(router, "/account");
    }
  }, [auth.sessionResolved, auth.isLoggedIn, isAdmin, router]);

  return allowed;
}
