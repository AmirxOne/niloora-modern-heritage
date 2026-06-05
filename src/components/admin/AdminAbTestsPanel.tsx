"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SelectBox } from "@/components/inputs";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import {
  ADMIN_AB_EXPERIMENT_IDS,
  AB_EXPERIMENTS,
  type AdminAbExperimentId,
} from "@/lib/ab/experiments";
import { useAdminAbTests, type AbVariantResult } from "@/lib/hooks/useAdminAbTests";
import { fa } from "@/lib/i18n/fa";

const t = fa.admin.abTests;

type ExperimentFilter = "all" | AdminAbExperimentId;

function variantLabel(variantId: string): string {
  return t.variants[variantId as keyof typeof t.variants] ?? variantId;
}

function mergeVariantRows(
  experimentId: AdminAbExperimentId,
  apiVariants: AbVariantResult[]
): AbVariantResult[] {
  const definition = AB_EXPERIMENTS[experimentId];
  if (!definition) return apiVariants;

  const byId = new Map(apiVariants.map((row) => [row.variantId, row]));
  return definition.variants.map((variant) =>
    byId.get(variant.id) ?? {
      variantId: variant.id,
      exposures: 0,
      conversions: 0,
      conversionRatePercent: 0,
    }
  );
}

function hasAnyEvents(variants: AbVariantResult[]): boolean {
  return variants.some((row) => row.exposures > 0 || row.conversions > 0);
}

export function AdminAbTestsPanel() {
  const admin = useAdminAbTests();
  const { allowed, isAdmin, results, isLoading, load } = admin;
  const [filter, setFilter] = useState<ExperimentFilter>("all");

  useEffect(() => {
    if (isAdmin) {
      void load(filter === "all" ? undefined : filter);
    }
  }, [isAdmin, filter, load]);

  const visibleExperiments = useMemo(() => {
    const ids = filter === "all" ? ADMIN_AB_EXPERIMENT_IDS : [filter];
    return ids.map((experimentId) => {
      const fromApi = results.find((item) => item.experimentId === experimentId);
      const variants = mergeVariantRows(experimentId, fromApi?.variants ?? []);
      return { experimentId, variants };
    });
  }, [filter, results]);

  const filterOptions = useMemo(
    () => [
      { value: "all", label: t.filterAll },
      ...ADMIN_AB_EXPERIMENT_IDS.map((id) => ({
        value: id,
        label: t.experiments[id].title,
      })),
    ],
    []
  );

  if (!allowed) return null;

  return (
    <div className="admin-ab-tests-panel">
      <div className="admin-orders-toolbar flex-wrap">
        <SelectBox
          label={t.filterLabel}
          value={filter}
          options={filterOptions}
          onValueChange={(value) => setFilter(value as ExperimentFilter)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => void load(filter === "all" ? undefined : filter)}
        >
          {t.refresh}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState variant="admin-cards" count={2} className="py-4" label={t.loading} />
      ) : (
        <div className="admin-ab-tests-list">
          {visibleExperiments.map(({ experimentId, variants }) => {
            const meta = t.experiments[experimentId];
            const definition = AB_EXPERIMENTS[experimentId];

            return (
              <section key={experimentId} className="admin-order-card admin-ab-tests-card">
                <header className="admin-ab-tests-card-head">
                  <div>
                    <p className="admin-order-id">{meta.title}</p>
                    <p className="admin-order-customer">{meta.description}</p>
                    <p className="mt-1 font-mono text-[11px] text-silver" dir="ltr">
                      {t.experimentIdLabel}: {experimentId}
                    </p>
                  </div>
                  <div className="text-left text-xs text-silver">
                    <p>
                      {t.pageLabel}:{" "}
                      <Link href={meta.page} className="text-turquoise hover:underline">
                        {meta.page}
                      </Link>
                    </p>
                  </div>
                </header>

                {!hasAnyEvents(variants) ? (
                  <UnifiedEmptyState title={t.empty} visual="shop" className="mt-2" />
                ) : (
                  <div className="admin-ab-tests-table-wrap">
                    <table className="admin-ab-tests-table">
                      <thead>
                        <tr>
                          <th scope="col">{t.variantLabel}</th>
                          <th scope="col">{t.exposureLabel}</th>
                          <th scope="col">{t.conversionLabel}</th>
                          <th scope="col">{t.conversionRateLabel}</th>
                          <th scope="col">{t.weightLabel}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((row) => {
                          const weight =
                            definition?.variants.find((item) => item.id === row.variantId)?.weight ??
                            null;
                          return (
                            <tr key={row.variantId}>
                              <td>
                                <span className="font-medium text-ivory">{variantLabel(row.variantId)}</span>
                                <span className="mt-0.5 block font-mono text-[11px] text-silver" dir="ltr">
                                  {row.variantId}
                                </span>
                              </td>
                              <td>{row.exposures.toLocaleString("fa-IR")}</td>
                              <td>{row.conversions.toLocaleString("fa-IR")}</td>
                              <td>{row.conversionRatePercent.toLocaleString("fa-IR")}٪</td>
                              <td>{weight != null ? t.weightValue(weight) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
