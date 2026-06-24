"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAdminVendorFinance } from "@/lib/hooks/useAdminVendorFinance";
import { fa } from "@/lib/i18n/fa";
import { formatTomanAmount } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.finance.marketplace;

function formatAmount(value: number): string {
  return t.toman(formatTomanAmount(value));
}

export function AdminMarketplaceFinanceSection() {
  const { isAdmin, finance, isLoading, loadFinance } = useAdminVendorFinance();

  useEffect(() => {
    if (isAdmin) void loadFinance();
  }, [isAdmin, loadFinance]);

  if (!isAdmin) return null;

  return (
    <section className="admin-finance-marketplace mt-10 border-t border-subtle pt-8">
      <header className="mb-6">
        <h2 className="font-display text-xl text-ivory">{t.sectionTitle}</h2>
        <p className="mt-1 text-sm text-silver">{t.sectionSubtitle}</p>
      </header>

      {isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : !finance ? (
        <p className="text-sm text-silver">{t.empty}</p>
      ) : (
        <div className="space-y-8">
          <div className="admin-finance-summary">
            <article className="admin-kpi-metric-card">
              <p className="admin-kpi-metric-label">{t.platformGross}</p>
              <p className="admin-kpi-metric-value">{formatAmount(finance.platform.grossAmount)}</p>
            </article>
            <article className="admin-kpi-metric-card">
              <p className="admin-kpi-metric-label">{t.platformCommission}</p>
              <p className="admin-kpi-metric-value">{formatAmount(finance.platform.commissionAmount)}</p>
            </article>
            <article className="admin-kpi-metric-card">
              <p className="admin-kpi-metric-label">{t.platformNetPending}</p>
              <p className="admin-kpi-metric-value">{formatAmount(finance.platform.netPending)}</p>
            </article>
            <article className="admin-kpi-metric-card">
              <p className="admin-kpi-metric-label">{t.platformOrderCount}</p>
              <p className="admin-kpi-metric-value">
                {finance.platform.orderCount.toLocaleString("fa-IR")}
              </p>
            </article>
          </div>

          {finance.topByGross.length > 0 ? (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-ivory">{t.topVendorsTitle}</h3>
              <div className="overflow-x-auto rounded-heritage border border-subtle">
                <table className="admin-table w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-subtle text-silver">
                      <th className="px-4 py-3 text-right font-medium">{t.vendorName}</th>
                      <th className="px-4 py-3 text-right font-medium">{t.gross}</th>
                      <th className="px-4 py-3 text-right font-medium">{t.commission}</th>
                      <th className="px-4 py-3 text-right font-medium">{t.netPending}</th>
                      <th className="px-4 py-3 text-right font-medium">{t.orderCount}</th>
                      <th className="px-4 py-3 text-right font-medium">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.topByGross.map((row) => (
                      <tr key={row.vendorId} className="border-b border-subtle/60 last:border-0">
                        <td className="px-4 py-3 text-ivory">
                          {row.displayNameFa ?? row.displayName}
                        </td>
                        <td className="px-4 py-3 text-ivory">{formatAmount(row.grossAmount)}</td>
                        <td className="px-4 py-3 text-silver">{formatAmount(row.commissionAmount)}</td>
                        <td className="px-4 py-3 text-silver">{formatAmount(row.netPending)}</td>
                        <td className="px-4 py-3 text-silver">
                          {row.orderCount.toLocaleString("fa-IR")}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href="/admin/vendors"
                            className="text-gold-dark underline"
                          >
                            {t.viewVendor}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
