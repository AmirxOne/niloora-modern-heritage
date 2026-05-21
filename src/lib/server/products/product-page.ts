import type { Product } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import {
  getCatalogProducts,
  getProductByIdFromDb,
  getRelatedProducts,
} from "@/lib/server/products";
export type ProductPagePayload = {
  product: Product;
  related: Product[];
};

export async function getProductPagePayload(id: string): Promise<ProductPagePayload | null> {
  const product = await getProductByIdFromDb(id);
  if (!product) return null;

  const catalog = await getCatalogProducts();
  const related = getRelatedProducts(catalog, product.id, 4);
  return { product, related };
}

export async function listProductIdsForSitemap(): Promise<
  { id: string; updatedAt: Date }[]
> {
  return prisma.product.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
