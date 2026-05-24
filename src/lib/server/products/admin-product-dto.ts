import type { Prisma } from "@prisma/client";
import { mapDbProduct } from "@/lib/server/products";
import type { Product } from "@/lib/types";

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  collection: true,
  ugcMedia: {
    where: { status: "approved" },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
} satisfies Prisma.ProductInclude;

export type DbProductAdmin = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export { productInclude as adminProductInclude };

export type AdminProductDto = Product & {
  collectionName: string | null;
};

export function toAdminProductDto(row: DbProductAdmin): AdminProductDto {
  const product = mapDbProduct(row);
  return {
    ...product,
    collectionId: row.collectionId ?? undefined,
    collectionName:
      row.collection?.namePersian ?? row.collection?.name ?? null,
  };
}
