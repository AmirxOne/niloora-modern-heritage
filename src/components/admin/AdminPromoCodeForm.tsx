"use client";

import { fa } from "@/lib/i18n/fa";
import { CheckBox } from "@/components/inputs";
import type { AdminPromoFormValues } from "@/lib/admin/promo-form";
import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";

type Props = {
  values: AdminPromoFormValues;
  onChange: (values: AdminPromoFormValues) => void;
  disabled?: boolean;
};

const typeOptions = [
  { value: "percent", label: fa.admin.promoCodes.typePercent },
  { value: "fixed", label: fa.admin.promoCodes.typeFixed },
];

export function AdminPromoCodeForm({ values, onChange, disabled }: Props) {
  const set = <K extends keyof AdminPromoFormValues>(key: K, value: AdminPromoFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="admin-promo-form grid gap-4">
      <TextBox
        label={fa.admin.promoCodes.code}
        value={values.code}
        onChange={(e) => set("code", e.target.value.toUpperCase())}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextBox
        label={fa.admin.promoCodes.label}
        value={values.label}
        onChange={(e) => set("label", e.target.value)}
        disabled={disabled}
      />
      <SelectBox
        label={fa.admin.promoCodes.type}
        value={values.type}
        options={typeOptions}
        disabled={disabled}
        onValueChange={(v) => set("type", v as AdminPromoFormValues["type"])}
      />
      <TextBox
        label={fa.admin.promoCodes.value}
        value={values.value}
        onChange={(e) => set("value", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextBox
        label={fa.admin.promoCodes.minSubtotal}
        value={values.minSubtotal}
        onChange={(e) => set("minSubtotal", e.target.value)}
        disabled={disabled}
        inputClassName="auth-input-ltr"
      />
      <TextAreaBox
        label={fa.admin.promoCodes.aliases}
        value={values.aliases}
        onChange={(e) => set("aliases", e.target.value)}
        disabled={disabled}
        rows={2}
        placeholder={fa.admin.promoCodes.aliasesHint}
        className="auth-input-ltr"
      />
      <CheckBox
        className="text-ivory-light"
        label={fa.admin.promoCodes.replacesSiteWide}
        checked={values.replacesSiteWide}
        onChange={(e) => set("replacesSiteWide", e.target.checked)}
        disabled={disabled}
      />
      <CheckBox
        className="text-ivory-light"
        label={fa.admin.promoCodes.active}
        checked={values.active}
        onChange={(e) => set("active", e.target.checked)}
        disabled={disabled}
      />
    </div>
  );
}
