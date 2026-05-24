"use client";

import { useEffect, useMemo, useState } from "react";
import { fa } from "@/lib/i18n/fa";
import { formatTomanAmount } from "@/lib/utils";
import { useAdminHomeKpi } from "@/lib/hooks/useAdminHomeKpi";
import { Button } from "@/components/ui/Button";

type PeriodKey = "daily" | "weekly" | "monthly";

function Sparkline({ values }: { values: number[] }) {
  const width = 220;
  const height = 56;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="admin-kpi-sparkline" aria-hidden>
      <polyline points={points} />
    </svg>
  );
}

function KpiMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="admin-kpi-metric-card">
      <p className="admin-kpi-metric-label">{label}</p>
      <p className="admin-kpi-metric-value">{value}</p>
      {hint ? <p className="admin-kpi-metric-hint">{hint}</p> : null}
    </article>
  );
}

export function AdminHomeKpiPanel() {
  const kpi = useAdminHomeKpi();
  const { isAdmin, load, isLoading } = kpi;
  const [period, setPeriod] = useState<PeriodKey>("daily");

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const chartSeries = useMemo(() => {
    if (!kpi.kpi) return [];
    if (period === "weekly") return kpi.kpi.weeklySales;
    if (period === "monthly") return kpi.kpi.monthlySales;
    return kpi.kpi.dailySales;
  }, [kpi.kpi, period]);

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="admin-kpi-panel">
      <div className="admin-kpi-head">
        <div>
          <h2>{fa.admin.home.kpi.title}</h2>
          <p>{fa.admin.home.kpi.subtitle}</p>
        </div>
        <Button type="button" variant="outline" disabled={isLoading} onClick={() => void load()}>
          {fa.admin.home.kpi.refresh}
        </Button>
      </div>

      {!kpi.kpi ? (
        <p className="text-sm text-silver">{fa.admin.home.kpi.loading}</p>
      ) : (
        <>
          <div className="admin-kpi-metrics-grid">
            <KpiMetric
              label={fa.admin.home.kpi.conversionRate}
              value={`${kpi.kpi.conversionRatePercent.toLocaleString("fa-IR")}٪`}
              hint={fa.admin.home.kpi.conversionHint(
                kpi.kpi.successfulOrders.toLocaleString("fa-IR"),
                kpi.kpi.attemptedOrders.toLocaleString("fa-IR")
              )}
            />
            <KpiMetric
              label={fa.admin.home.kpi.averageBasket}
              value={fa.admin.home.kpi.toman(formatTomanAmount(kpi.kpi.averageBasketValue))}
            />
            <KpiMetric
              label={fa.admin.home.kpi.salesToday}
              value={fa.admin.home.kpi.toman(formatTomanAmount(kpi.kpi.salesToday))}
            />
            <KpiMetric
              label={fa.admin.home.kpi.salesWeek}
              value={fa.admin.home.kpi.toman(formatTomanAmount(kpi.kpi.salesWeek))}
            />
            <KpiMetric
              label={fa.admin.home.kpi.salesMonth}
              value={fa.admin.home.kpi.toman(formatTomanAmount(kpi.kpi.salesMonth))}
            />
          </div>

          <div className="admin-kpi-chart-card">
            <div className="admin-kpi-chart-head">
              <h3>{fa.admin.home.kpi.salesTimeline}</h3>
              <div className="admin-kpi-chart-tabs">
                <button
                  type="button"
                  className={period === "daily" ? "is-active" : ""}
                  onClick={() => setPeriod("daily")}
                >
                  {fa.admin.home.kpi.daily}
                </button>
                <button
                  type="button"
                  className={period === "weekly" ? "is-active" : ""}
                  onClick={() => setPeriod("weekly")}
                >
                  {fa.admin.home.kpi.weekly}
                </button>
                <button
                  type="button"
                  className={period === "monthly" ? "is-active" : ""}
                  onClick={() => setPeriod("monthly")}
                >
                  {fa.admin.home.kpi.monthly}
                </button>
              </div>
            </div>
            {chartSeries.length > 0 ? (
              <>
                <Sparkline values={chartSeries.map((item) => item.value)} />
                <div className="admin-kpi-chart-legend">
                  {chartSeries.slice(-8).map((item) => (
                    <span key={`${period}-${item.label}`}>
                      {item.label}: {formatTomanAmount(item.value)}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-silver">{fa.admin.home.kpi.empty}</p>
            )}
          </div>

          <div className="admin-kpi-stone-card">
            <h3>{fa.admin.home.kpi.stoneSales}</h3>
            {kpi.kpi.stoneSales.length === 0 ? (
              <p className="text-xs text-silver">{fa.admin.home.kpi.empty}</p>
            ) : (
              <ul className="admin-kpi-stone-list">
                {kpi.kpi.stoneSales.map((item) => (
                  <li key={item.stone}>
                    <strong>{item.stone}</strong>
                    <span>{fa.admin.home.kpi.qty(item.quantity.toLocaleString("fa-IR"))}</span>
                    <span>{fa.admin.home.kpi.toman(formatTomanAmount(item.revenue))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
