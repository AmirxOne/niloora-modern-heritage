"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

interface AuthGuardProps {
  redirectTo: string;
  children: React.ReactNode;
}

export function AuthGuard({ redirectTo, children }: AuthGuardProps) {
  const router = useRouter();
  const { auth } = useApp();

  useEffect(() => {
    if (auth.hydrated && auth.sessionResolved && !auth.isLoggedIn) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [auth.hydrated, auth.sessionResolved, auth.isLoggedIn, redirectTo, router]);

  if (!auth.hydrated || !auth.sessionResolved || !auth.isLoggedIn) return null;
  return <>{children}</>;
}
