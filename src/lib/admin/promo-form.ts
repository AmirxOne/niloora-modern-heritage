import type { AdminPromoCodeRecord } from "@/lib/server/promo/promo-code";

export type AdminPromoFormValues = {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  aliases: string;
  replacesSiteWide: boolean;
  active: boolean;
};

export function emptyAdminPromoForm(): AdminPromoFormValues {
  return {
    code: "",
    label: "",
    type: "percent",
    value: "",
    minSubtotal: "0",
    aliases: "",
    replacesSiteWide: true,
    active: true,
  };
}

export function adminPromoToForm(record: AdminPromoCodeRecord): AdminPromoFormValues {
  return {
    code: record.code,
    label: record.label,
    type: record.type,
    value: String(record.value),
    minSubtotal: String(record.minSubtotal),
    aliases: record.aliases.join(", "),
    replacesSiteWide: record.replacesSiteWide,
    active: record.active,
  };
}

export function adminPromoFormToPayload(values: AdminPromoFormValues) {
  return {
    code: values.code,
    label: values.label,
    type: values.type,
    value: Number(values.value.replace(/[^\d]/g, "")),
    minSubtotal: Number(values.minSubtotal.replace(/[^\d]/g, "") || "0"),
    aliases: values.aliases
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    replacesSiteWide: values.replacesSiteWide,
    active: values.active,
  };
}
