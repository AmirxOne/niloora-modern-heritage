import type { Prisma } from "@prisma/client";
import { isMarketplaceCatalogFilterEnabled } from "@/lib/server/marketplace/feature-flags";

/** Public catalog visibility — only applied when ENABLE_MARKETPLACE_FILTER=true. */
export function buildPublicCatalogProductWhere(): Prisma.ProductWhereInput | undefined {
  if (!isMarketplaceCatalogFilterEnabled()) {
    return undefined;
  }

  return {
    publicationStatus: "published",
    OR: [{ vendorId: null }, { vendor: { status: "active" } }],
  };
}

export function mergePublicCatalogWhere(
  base?: Prisma.ProductWhereInput
): Prisma.ProductWhereInput {
  const catalogFilter = buildPublicCatalogProductWhere();
  if (!catalogFilter) {
    return base ?? {};
  }
  if (!base || Object.keys(base).length === 0) {
    return catalogFilter;
  }
  return { AND: [base, catalogFilter] };
}
