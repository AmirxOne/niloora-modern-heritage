import type { ProductVendorSummary } from "@/lib/types/marketplace";

type VendorNameFields = Pick<ProductVendorSummary, "displayName" | "displayNameFa">;

export function getVendorDisplayName(vendor: VendorNameFields): string {
  const faName = vendor.displayNameFa?.trim();
  return faName || vendor.displayName;
}

export function vendorDisplayInitial(vendor: VendorNameFields): string {
  const name = getVendorDisplayName(vendor).trim();
  if (!name) return "؟";
  return name.charAt(0);
}
