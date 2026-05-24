import type { BundleOfferDefinition } from "@/lib/types";

export type AdminBundleFormValues = {
  title: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  requiredProductIds: string;
  active: boolean;
};

export function emptyAdminBundleForm(): AdminBundleFormValues {
  return {
    title: "",
    description: "",
    discountType: "percent",
    discountValue: "",
    requiredProductIds: "",
    active: true,
  };
}

export function adminBundleToForm(bundle: BundleOfferDefinition): AdminBundleFormValues {
  return {
    title: bundle.title,
    description: bundle.description ?? "",
    discountType: bundle.discountType,
    discountValue: String(bundle.discountValue),
    requiredProductIds: bundle.requiredProductIds.join("\n"),
    active: bundle.active,
  };
}

export function adminBundleFormToPayload(values: AdminBundleFormValues) {
  return {
    title: values.title,
    description: values.description,
    discountType: values.discountType,
    discountValue: Number(values.discountValue.replace(/[^\d]/g, "")),
    requiredProductIds: values.requiredProductIds
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
    active: values.active,
  };
}
