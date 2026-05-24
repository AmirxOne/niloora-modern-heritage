"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { canAccessContentWorkflow } from "@/lib/auth/content-workflow";

interface AdminGuardProps {
  redirectTo: string;
  children: React.ReactNode;
}

export function AdminGuard({ redirectTo, children }: AdminGuardProps) {
  const router = useRouter();
  const { auth } = useApp();

  useEffect(() => {
    if (!auth.sessionResolved) return;
    if (!auth.isLoggedIn) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    if (auth.user?.role !== "admin") {
      router.replace("/account");
    }
  }, [auth.sessionResolved, auth.isLoggedIn, auth.user?.role, redirectTo, router]);

  if (!auth.sessionResolved || !auth.isLoggedIn || auth.user?.role !== "admin") {
    return (
      <div className="admin-guard-state" aria-busy={!auth.sessionResolved}>
        <p className="text-silver">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return <>{children}</>;
}

type ContentWorkflowGuardProps = {
  redirectTo: string;
  children: React.ReactNode;
};

export function ContentWorkflowGuard({ redirectTo, children }: ContentWorkflowGuardProps) {
  const router = useRouter();
  const { auth } = useApp();

  useEffect(() => {
    if (!auth.sessionResolved) return;
    if (!auth.isLoggedIn) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    if (!canAccessContentWorkflow(auth.user?.role)) {
      router.replace("/account");
    }
  }, [auth.sessionResolved, auth.isLoggedIn, auth.user?.role, redirectTo, router]);

  if (!auth.sessionResolved || !auth.isLoggedIn || !canAccessContentWorkflow(auth.user?.role)) {
    return (
      <div className="admin-guard-state" aria-busy={!auth.sessionResolved}>
        <p className="text-silver">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return <>{children}</>;
}
