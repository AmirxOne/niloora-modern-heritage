"use client";

import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";
import { fa } from "@/lib/i18n/fa";
import type { AdminBundleFormValues } from "@/lib/admin/bundle-form";

type Props = {
  values: AdminBundleFormValues;
  onChange: (values: AdminBundleFormValues) => void;
  disabled?: boolean;
};

const discountTypeOptions = [
  { value: "percent", label: fa.admin.bundles.discountPercent },
  { value: "fixed", label: fa.admin.bundles.discountFixed },
];

export function AdminBundleForm({ values, onChange, disabled }: Props) {
  const set = <K extends keyof AdminBundleFormValues>(key: K, value: AdminBundleFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="admin-promo-form grid gap-4">
      <TextBox
        label={fa.admin.bundles.titleLabel}
        value={values.title}
        onChange={(event) => set("title", event.target.value)}
        disabled={disabled}
      />
      <TextAreaBox
        label={fa.admin.bundles.descriptionLabel}
        value={values.description}
        onChange={(event) => set("description", event.target.value)}
        disabled={disabled}
        rows={2}
      />
      <SelectBox
        label={fa.admin.bundles.discountType}
        value={values.discountType}
        options={discountTypeOptions}
        disabled={disabled}
        onValueChange={(value) => set("discountType", value as "percent" | "fixed")}
      />
      <TextBox
        label={fa.admin.bundles.discountValue}
        value={values.discountValue}
        onChange={(event) => set("discountValue", event.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextAreaBox
        label={fa.admin.bundles.productIds}
        value={values.requiredProductIds}
        onChange={(event) => set("requiredProductIds", event.target.value)}
        disabled={disabled}
        rows={3}
        placeholder={fa.admin.bundles.productIdsHint}
        className="auth-input-ltr"
      />
      <label className="flex items-center gap-2 text-sm text-ivory-light">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(event) => set("active", event.target.checked)}
          disabled={disabled}
        />
        {fa.admin.bundles.active}
      </label>
    </div>
  );
}
