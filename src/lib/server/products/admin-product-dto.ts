import type { Prisma } from "@prisma/client";
import { mapDbProduct } from "@/lib/server/products";
import type { Product } from "@/lib/types";

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  collection: true,
  vendor: { select: { id: true, slug: true, displayName: true, status: true } },
} satisfies Prisma.ProductInclude;

export type DbProductAdmin = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export { productInclude as adminProductInclude };

export type AdminProductDto = Product & {
  collectionName: string | null;
  updatedAt?: string;
  vendorDisplayName?: string | null;
};

type DbProductAdminWithVendor = DbProductAdmin;

export function toAdminProductDto(row: DbProductAdminWithVendor): AdminProductDto {
  const product = mapDbProduct(row);
  return {
    ...product,
    collectionId: row.collectionId ?? undefined,
    collectionName:
      row.collection?.namePersian ?? row.collection?.name ?? null,
    vendorDisplayName: row.vendor?.displayName ?? null,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : typeof row.updatedAt === "string"
          ? row.updatedAt
          : undefined,
  };
}
