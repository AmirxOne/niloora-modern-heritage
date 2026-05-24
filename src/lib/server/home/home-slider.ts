import type { Product } from "@/lib/types";
import type { HomeSliderItemDto } from "@/lib/types/home-content";
import { prisma } from "@/lib/server/prisma";
import { getSliderProducts, mapDbProduct } from "@/lib/server/products";
import type { Prisma } from "@prisma/client";

const sliderProductInclude = {
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

export async function listAdminSliderItems(): Promise<HomeSliderItemDto[]> {
  const rows = await prisma.homeSliderItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { product: { select: { namePersian: true, name: true, image: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    sortOrder: row.sortOrder,
    active: row.active,
    productName: row.product.namePersian || row.product.name,
    productImage: row.product.image,
  }));
}

export async function resolveHomeSliderProducts(
  catalog: Product[],
  limit = 6
): Promise<Product[]> {
  const rows = await prisma.homeSliderItem.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  if (rows.length === 0) return getSliderProducts(catalog, limit);

  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((row) => row.productId) } },
    include: sliderProductInclude,
  });
  const productById = new Map(products.map((p) => [p.id, p]));
  const catalogById = new Map(catalog.map((p) => [p.id, p]));

  const fromDb = rows
    .map((row) => {
      const dbProduct = productById.get(row.productId);
      if (!dbProduct) return null;
      const mapped = mapDbProduct(dbProduct);
      return catalogById.get(mapped.id) ?? mapped;
    })
    .filter((p): p is Product => p !== null);

  return fromDb.slice(0, limit);
}

export async function createSliderItem(input: {
  productId: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  return prisma.homeSliderItem.create({
    data: {
      productId: input.productId,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
}

export async function updateSliderItem(
  id: string,
  input: Partial<{ productId: string; sortOrder: number; active: boolean }>
) {
  if (input.productId) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
  }
  return prisma.homeSliderItem.update({
    where: { id },
    data: {
      ...(input.productId !== undefined ? { productId: input.productId } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

export async function deleteSliderItem(id: string) {
  return prisma.homeSliderItem.delete({ where: { id } });
}
