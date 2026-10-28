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

/**
 * Sitemap + generateStaticParams feed — ONLY publicly visible products:
 * suspended/pending sellers' products must never leak into the sitemap
 * or be prerendered as indexable pages. Platform products (sellerId null)
 * always qualify.
 */
export async function listProductIdsForSitemap(): Promise<
  { id: string; updatedAt: Date }[]
> {
  return prisma.product.findMany({
    where: {
      OR: [{ sellerId: null }, { seller: { status: "active" } }],
    },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** Is this product publicly visible right now (seller active)? */
export async function isProductPubliclyVisible(id: string): Promise<boolean> {
  const row = await prisma.product.findUnique({
    where: { id },
    select: { seller: { select: { status: true } } },
  });
  if (!row) return false;
  return !row.seller || row.seller.status === "active";
}
