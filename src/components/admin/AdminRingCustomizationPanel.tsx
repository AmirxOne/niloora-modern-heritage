"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { useAdminRingCustomization } from "@/lib/hooks/useAdminRingCustomization";

function csvToIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminRingCustomizationPanel() {
  const admin = useAdminRingCustomization();
  const [productId, setProductId] = useState("");
  const [whitelists, setWhitelists] = useState({
    shankArtisanIds: "",
    shankPatternIds: "",
    stoneArtisanIds: "",
    stoneTextIds: "",
    scriptStyleIds: "",
  });
  const [localConfig, setLocalConfig] = useState<Record<string, string | boolean>>({});

  const editableCatalog = useMemo(() => {
    if (!admin.catalog) return null;
    return {
      artisans: admin.catalog.artisans.map((item) => ({ ...item })),
      shankPatterns: admin.catalog.shankPatterns.map((item) => ({ ...item })),
      stoneTexts: admin.catalog.stoneTexts.map((item) => ({ ...item })),
      scriptStyles: admin.catalog.scriptStyles.map((item) => ({ ...item })),
    };
  }, [admin.catalog]);
  const [catalogDraft, setCatalogDraft] = useState(editableCatalog);

  useEffect(() => {
    if (admin.isAdmin) {
      void admin.loadCatalog();
    }
  }, [admin.isAdmin, admin.loadCatalog]);

  useEffect(() => {
    if (!admin.config) return;
    setLocalConfig({
      enabled: admin.config.config.enabled,
      sizeBase: String(admin.config.config.sizeBase ?? ""),
      sizeMin: String(admin.config.config.sizeMin ?? ""),
      sizeMax: String(admin.config.config.sizeMax ?? ""),
      sizePricingMode: admin.config.config.sizePricingMode,
      sizeFixedDelta: String(admin.config.config.sizeFixedDelta),
      sizeStepAmount: String(admin.config.config.sizeStepAmount),
      shankEnabled: admin.config.config.shankEnabled,
      shankDefaultIncluded: admin.config.config.shankDefaultIncluded,
      shankDefaultRemovalCredit: String(admin.config.config.shankDefaultRemovalCredit),
      stoneEnabled: admin.config.config.stoneEnabled,
      stoneDefaultIncluded: admin.config.config.stoneDefaultIncluded,
      stoneDefaultRemovalCredit: String(admin.config.config.stoneDefaultRemovalCredit),
      baseLeadTimeDays: String(admin.config.config.baseLeadTimeDays),
      sizeLeadTimeDays: String(admin.config.config.sizeLeadTimeDays),
      shankLeadTimeDays: String(admin.config.config.shankLeadTimeDays),
      stoneLeadTimeDays: String(admin.config.config.stoneLeadTimeDays),
    });
    setWhitelists({
      shankArtisanIds: admin.config.whitelist.shankArtisanIds.join(","),
      shankPatternIds: admin.config.whitelist.shankPatternIds.join(","),
      stoneArtisanIds: admin.config.whitelist.stoneArtisanIds.join(","),
      stoneTextIds: admin.config.whitelist.stoneTextIds.join(","),
      scriptStyleIds: admin.config.whitelist.scriptStyleIds.join(","),
    });
  }, [admin.config]);

  useEffect(() => {
    setCatalogDraft(editableCatalog);
  }, [editableCatalog]);

  if (!admin.allowed) return null;

  return (
    <div className="admin-orders-panel space-y-6">
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">شخصی‌سازی خرید انگشتر (فاز ۱)</h2>
        <p className="mb-4 text-xs text-silver">
          این پنل برای تنظیم config محصول، whitelistها و قیمت‌های پایه کاتالوگ است.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <TextBox
            label="شناسه محصول"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            inputClassName="auth-input-ltr min-w-[20rem]"
          />
          <Button
            type="button"
            variant="outline"
            disabled={admin.isLoading || !productId.trim()}
            onClick={() => void admin.loadProductConfig(productId.trim())}
          >
            بارگذاری تنظیمات محصول
          </Button>
        </div>
      </section>

      <section className="admin-order-card">
        <h3 className="mb-3 text-sm font-semibold text-ivory">تنظیمات محصول</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["enabled", "فعال‌سازی شخصی‌سازی"],
            ["shankEnabled", "فعال‌سازی قلم‌کاری رکاب"],
            ["shankDefaultIncluded", "قلم‌کاری پیش‌فرض دارد"],
            ["stoneEnabled", "فعال‌سازی حکاکی سنگ"],
            ["stoneDefaultIncluded", "حکاکی پیش‌فرض دارد"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(localConfig[key])}
                onChange={(e) => setLocalConfig((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
          <TextBox label="سایز پایه" value={String(localConfig.sizeBase ?? "")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeBase: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="سایز حداقل" value={String(localConfig.sizeMin ?? "")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeMin: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="سایز حداکثر" value={String(localConfig.sizeMax ?? "")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeMax: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="مدل قیمت سایز (free/fixed/step)" value={String(localConfig.sizePricingMode ?? "free")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizePricingMode: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="دلتا ثابت سایز" value={String(localConfig.sizeFixedDelta ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeFixedDelta: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="مبلغ هر پله سایز" value={String(localConfig.sizeStepAmount ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeStepAmount: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="کسر حذف قلم‌کاری" value={String(localConfig.shankDefaultRemovalCredit ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, shankDefaultRemovalCredit: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="کسر حذف حکاکی" value={String(localConfig.stoneDefaultRemovalCredit ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, stoneDefaultRemovalCredit: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="زمان پایه (روز)" value={String(localConfig.baseLeadTimeDays ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, baseLeadTimeDays: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="زمان سایز (روز)" value={String(localConfig.sizeLeadTimeDays ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, sizeLeadTimeDays: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="زمان قلم‌کاری (روز)" value={String(localConfig.shankLeadTimeDays ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, shankLeadTimeDays: e.target.value }))} inputClassName="auth-input-ltr" />
          <TextBox label="زمان حکاکی (روز)" value={String(localConfig.stoneLeadTimeDays ?? "0")} onChange={(e) => setLocalConfig((p) => ({ ...p, stoneLeadTimeDays: e.target.value }))} inputClassName="auth-input-ltr" />
        </div>
      </section>

      <section className="admin-order-card">
        <h3 className="mb-3 text-sm font-semibold text-ivory">Whitelist محصول (CSV شناسه‌ها)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <TextAreaBox label="shankArtisanIds" value={whitelists.shankArtisanIds} onChange={(e) => setWhitelists((p) => ({ ...p, shankArtisanIds: e.target.value }))} rows={2} />
          <TextAreaBox label="shankPatternIds" value={whitelists.shankPatternIds} onChange={(e) => setWhitelists((p) => ({ ...p, shankPatternIds: e.target.value }))} rows={2} />
          <TextAreaBox label="stoneArtisanIds" value={whitelists.stoneArtisanIds} onChange={(e) => setWhitelists((p) => ({ ...p, stoneArtisanIds: e.target.value }))} rows={2} />
          <TextAreaBox label="stoneTextIds" value={whitelists.stoneTextIds} onChange={(e) => setWhitelists((p) => ({ ...p, stoneTextIds: e.target.value }))} rows={2} />
          <TextAreaBox label="scriptStyleIds" value={whitelists.scriptStyleIds} onChange={(e) => setWhitelists((p) => ({ ...p, scriptStyleIds: e.target.value }))} rows={2} />
        </div>
        <div className="mt-4">
          <Button
            type="button"
            disabled={admin.isSaving || !productId.trim()}
            onClick={() =>
              void admin.saveProductConfig(productId.trim(), {
                config: {
                  enabled: Boolean(localConfig.enabled),
                  sizeBase: Number(localConfig.sizeBase ?? 0),
                  sizeMin: Number(localConfig.sizeMin ?? 0),
                  sizeMax: Number(localConfig.sizeMax ?? 0),
                  sizePricingMode: String(localConfig.sizePricingMode ?? "free"),
                  sizeFixedDelta: Number(localConfig.sizeFixedDelta ?? 0),
                  sizeStepAmount: Number(localConfig.sizeStepAmount ?? 0),
                  shankEnabled: Boolean(localConfig.shankEnabled),
                  shankDefaultIncluded: Boolean(localConfig.shankDefaultIncluded),
                  shankDefaultRemovalCredit: Number(localConfig.shankDefaultRemovalCredit ?? 0),
                  stoneEnabled: Boolean(localConfig.stoneEnabled),
                  stoneDefaultIncluded: Boolean(localConfig.stoneDefaultIncluded),
                  stoneDefaultRemovalCredit: Number(localConfig.stoneDefaultRemovalCredit ?? 0),
                  baseLeadTimeDays: Number(localConfig.baseLeadTimeDays ?? 0),
                  sizeLeadTimeDays: Number(localConfig.sizeLeadTimeDays ?? 0),
                  shankLeadTimeDays: Number(localConfig.shankLeadTimeDays ?? 0),
                  stoneLeadTimeDays: Number(localConfig.stoneLeadTimeDays ?? 0),
                },
                whitelist: {
                  shankArtisanIds: csvToIds(whitelists.shankArtisanIds),
                  shankPatternIds: csvToIds(whitelists.shankPatternIds),
                  stoneArtisanIds: csvToIds(whitelists.stoneArtisanIds),
                  stoneTextIds: csvToIds(whitelists.stoneTextIds),
                  scriptStyleIds: csvToIds(whitelists.scriptStyleIds),
                },
              })
            }
          >
            ذخیره تنظیمات محصول
          </Button>
        </div>
      </section>

      <section className="admin-order-card">
        <h3 className="mb-3 text-sm font-semibold text-ivory">کاتالوگ قیمت پایه (ادیت سریع)</h3>
        {!catalogDraft ? (
          <p className="text-sm text-silver">کاتالوگ هنوز بارگذاری نشده است.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              {catalogDraft.artisans.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_100px_120px] items-center gap-2">
                  <TextBox
                    label={index === 0 ? "طراح" : ""}
                    value={item.name}
                    onChange={(e) =>
                      setCatalogDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              artisans: prev.artisans.map((a) =>
                                a.id === item.id ? { ...a, name: e.target.value } : a
                              ),
                            }
                          : prev
                      )
                    }
                  />
                  <TextBox
                    label={index === 0 ? "scope" : ""}
                    value={item.scope}
                    onChange={(e) =>
                      setCatalogDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              artisans: prev.artisans.map((a) =>
                                a.id === item.id ? { ...a, scope: e.target.value as "shank" | "stone" | "both" } : a
                              ),
                            }
                          : prev
                      )
                    }
                  />
                  <TextBox
                    label={index === 0 ? "قیمت" : ""}
                    value={String(item.priceAdd)}
                    onChange={(e) =>
                      setCatalogDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              artisans: prev.artisans.map((a) =>
                                a.id === item.id ? { ...a, priceAdd: Number(e.target.value) || 0 } : a
                              ),
                            }
                          : prev
                      )
                    }
                    inputClassName="auth-input-ltr"
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={admin.isSaving}
              onClick={() =>
                void admin.saveCatalog({
                  artisans: catalogDraft.artisans,
                  shankPatterns: catalogDraft.shankPatterns.map((item) => ({
                    id: item.id,
                    title: item.name,
                    active: item.active,
                    complexityLevel: item.complexityLevel,
                    priceAdd: item.priceAdd,
                    imageUrl: item.imageUrl,
                  })),
                  stoneTexts: catalogDraft.stoneTexts.map((item) => ({
                    id: item.id,
                    text: item.name,
                    active: item.active,
                    meaning: item.meaning,
                    priceAdd: item.priceAdd,
                    previewImageUrl: item.previewImageUrl,
                  })),
                  scriptStyles: catalogDraft.scriptStyles.map((item) => ({
                    id: item.id,
                    title: item.name,
                    active: item.active,
                    priceAdd: item.priceAdd,
                    previewImageUrl: item.previewImageUrl,
                  })),
                })
              }
            >
              ذخیره کاتالوگ
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

