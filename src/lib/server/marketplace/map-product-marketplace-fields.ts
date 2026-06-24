import type { ProductPublicationStatus } from "@/lib/types/marketplace";
import { isProductPublicationStatus } from "@/lib/types/marketplace";

type DbProductMarketplaceFields = {
  vendorId?: string | null;
  publicationStatus?: string | null;
};

export type ProductMarketplaceFields = {
  vendorId?: string;
  publicationStatus?: ProductPublicationStatus;
};

/** Passive DB → domain mapping. Does not affect catalog visibility (Phase 2+). */
export function mapProductMarketplaceFields(
  product: DbProductMarketplaceFields
): ProductMarketplaceFields {
  const fields: ProductMarketplaceFields = {};

  if (product.vendorId) {
    fields.vendorId = product.vendorId;
  }

  if (
    product.publicationStatus &&
    isProductPublicationStatus(product.publicationStatus)
  ) {
    fields.publicationStatus = product.publicationStatus;
  }

  return fields;
}
