"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client-fetch";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { getAuthDeniedMessage, isAuthDenied, parseJsonResponse } from "@/lib/hooks/fetch-utils";
import type { AdminDemandAnalyticsDto } from "@/lib/server/admin/demand-analytics";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";
import { toast } from "sonner";

export function AdminDemandWidget() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";
  const allowed = useAdminAccess(isAdmin);
  const [demand, setDemand] = useState<AdminDemandAnalyticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const t = fa.admin.demand;

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/admin/analytics/demand");
      if (isAuthDenied(response)) {
        toast.error(getAuthDeniedMessage(response.status, "admin"));
        setDemand(null);
        return;
      }
      const data = await parseJsonResponse<{ demand?: AdminDemandAnalyticsDto; message?: string }>(
        response
      );
      if (!response.ok || !data?.demand) {
        toast.error(data?.message ?? "دریافت تقاضای باز انجام نشد.");
        return;
      }
      setDemand(data.demand);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void load();
    }
  }, [isAdmin, load]);

  if (!allowed) return null;

  const topProducts = demand?.topProducts.slice(0, 5) ?? [];

  return (
    <section className="admin-demand-widget">
      <div className="admin-kpi-head">
        <div>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
          {t.refresh}
        </Button>
      </div>

      {isLoading && !demand ? (
        <LoadingState variant="admin-rows" label={t.loading} />
      ) : topProducts.length === 0 ? (
        <p className="admin-orders-empty py-8">{t.empty}</p>
      ) : (
        <ol className="admin-demand-list">
          {topProducts.map((row, index) => (
            <li key={row.productId} className="admin-demand-row">
              <span className="admin-demand-rank">{(index + 1).toLocaleString("fa-IR")}</span>
              <div className="admin-demand-row-body">
                <Link href={`/product/${row.productId}`} className="admin-demand-product-name">
                  {row.name}
                </Link>
                <div className="admin-demand-metrics">
                  <span>
                    {t.wishlist}: {row.wishlistCount.toLocaleString("fa-IR")}
                  </span>
                  <span>
                    {t.backInStock}: {row.pendingBackInStockCount.toLocaleString("fa-IR")}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
