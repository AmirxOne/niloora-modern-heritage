import type { ProductVendorSummary } from "@/lib/types/marketplace";
import type { VendorStatus } from "@/lib/types/vendor";

type DbVendorSummary = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
};

export function mapProductVendorSummary(
  vendor: DbVendorSummary | null | undefined
): ProductVendorSummary | undefined {
  if (!vendor) return undefined;
  return {
    id: vendor.id,
    slug: vendor.slug,
    displayName: vendor.displayName,
    status: vendor.status as VendorStatus,
  };
}

/** Copies nullable product.vendorId onto order line items (platform = null). */
export function resolveOrderItemVendorId(vendorId: string | null | undefined): string | null {
  return vendorId ?? null;
}
