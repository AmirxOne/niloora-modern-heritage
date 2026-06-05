"use client";

import { apiFetch } from "@/lib/api/client-fetch";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "@/lib/hooks/fetch-utils";
import { fa } from "@/lib/i18n/fa";

const t = fa.admin.abTests.toast;

export type AbVariantResult = {
  variantId: string;
  exposures: number;
  conversions: number;
  conversionRatePercent: number;
};

export type AbExperimentResult = {
  experimentId: string;
  variants: AbVariantResult[];
};

export function useAdminAbTests() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [results, setResults] = useState<AbExperimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (experimentId?: string) => {
      if (!isAdmin) return;
      setIsLoading(true);
      try {
        const query = experimentId ? `?experimentId=${encodeURIComponent(experimentId)}` : "";
        const response = await apiFetch(`/api/admin/ab-tests/results${query}`);
        if (isAuthDenied(response)) {
          toast.error(getAuthDeniedMessage(response.status, "admin"));
          setResults([]);
          return;
        }
        if (!response.ok) {
          toast.error(t.loadError);
          return;
        }
        const data = await parseJsonResponse<{ results?: AbExperimentResult[] }>(response);
        setResults(data?.results ?? []);
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  return { allowed, isAdmin, results, isLoading, load };
}
