"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { canAccessContentWorkflow } from "@/lib/auth/content-workflow";
import { performAccessRedirect } from "@/lib/navigation/access-redirect";
import { useApp } from "@/lib/context/AppContext";
import { LoadingState } from "@/components/ui/loading/LoadingState";

interface AdminGuardProps {
  redirectTo: string;
  children: React.ReactNode;
}

export function AdminGuard({ redirectTo, children }: AdminGuardProps) {
  const router = useRouter();
  const { auth } = useApp();

  const isAdmin = auth.user?.role === "admin";
  const allowed = auth.sessionResolved && auth.isLoggedIn && isAdmin;

  useEffect(() => {
    if (!auth.sessionResolved) return;

    if (!auth.isLoggedIn) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    if (!isAdmin) {
      performAccessRedirect(router, "/account");
    }
  }, [auth.sessionResolved, auth.isLoggedIn, isAdmin, redirectTo, router]);

  if (!auth.sessionResolved) {
    return (
      <div className="admin-guard-state">
        <LoadingState variant="inline" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}

type ContentWorkflowGuardProps = {
  redirectTo: string;
  children: React.ReactNode;
};

export function ContentWorkflowGuard({ redirectTo, children }: ContentWorkflowGuardProps) {
  const router = useRouter();
  const { auth } = useApp();

  const isAllowed = canAccessContentWorkflow(auth.user?.role);
  const allowed = auth.sessionResolved && auth.isLoggedIn && isAllowed;

  useEffect(() => {
    if (!auth.sessionResolved) return;

    if (!auth.isLoggedIn) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    if (!isAllowed) {
      performAccessRedirect(router, "/account");
    }
  }, [auth.sessionResolved, auth.isLoggedIn, isAllowed, redirectTo, router]);

  if (!auth.sessionResolved) {
    return (
      <div className="admin-guard-state">
        <LoadingState variant="inline" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
