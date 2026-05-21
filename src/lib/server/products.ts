import type { Prisma } from "@prisma/client";
import type { PreOwnedInfo, Product } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
const preOwnedGrades = new Set(["excellent", "very-good", "good"]);

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  collection: true,
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export type CollectionDto = {
  id: string;
  name: string;
  namePersian: string;
};

function merchandiseScore(product: Product): number {
  return (product.featured ? 4 : 0) + (product.bestseller ? 2 : 0);
}

export function mapDbProduct(product: DbProduct): Product {
  // PURPOSE: isolate DB-to-domain mapping so UI never depends on Prisma shapes.
  const preOwnedGrade = product.preOwnedInfo?.grade ?? "good";
  return {
    id: product.id,
    name: product.name,
    namePersian: product.namePersian,
    listing: {
      tier: product.listing?.tier === "economy" ? "economy" : "premium",
      headline: product.listing?.headline ?? "",
      details: Array.isArray(product.listing?.details) ? (product.listing?.details as string[]) : [],
      extraTags: Array.isArray(product.listing?.extraTags)
        ? (product.listing?.extraTags as ("pre-owned")[])
        : undefined,
    },
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
    image: product.image,
    images: product.images.map((item) => item.url),
    category: product.category as Product["category"],
    metal: product.metal as Product["metal"],
    stone: product.stone as Product["stone"],
    stoneShape: product.stoneShape as Product["stoneShape"],
    engravingType: product.engravingType as Product["engravingType"],
    availability: product.availability as Product["availability"],
    stock: product.stock,
    featured: product.featured,
    bestseller: product.bestseller,
    collection: product.collection?.name,
    collectionId: product.collectionId ?? undefined,
    initialSalesCount: product.initialSalesCount ?? 0,
    condition: product.condition as Product["condition"],
    preOwned: product.preOwnedInfo
      ? {
          originalPrice: product.preOwnedInfo.originalPrice,
          depreciationPercent: product.preOwnedInfo.depreciationPercent,
          grade: preOwnedGrades.has(preOwnedGrade)
            ? (preOwnedGrade as PreOwnedInfo["grade"])
            : "good",
          certifiedRefurbished: product.preOwnedInfo.certifiedRefurbished,
          canRemake: product.preOwnedInfo.canRemake,
          buybackRatePercent: product.preOwnedInfo.buybackRatePercent,
          story: product.preOwnedInfo.story ?? undefined,
        }
      : undefined,
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  // FLOW: read full catalog with include graph, then map to shared Product type.
  const rows = await prisma.product.findMany({
    include: productInclude,
  });
  return rows.map(mapDbProduct);
}

export async function getProductByIdFromDb(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  return row ? mapDbProduct(row) : null;
}

export async function getPreOwnedProductsFromDb(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { condition: "pre-owned" },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapDbProduct);
}

export async function getCollectionsFromDb(): Promise<CollectionDto[]> {
  const rows = await prisma.collection.findMany({
    orderBy: { id: "asc" },
  });
  return rows.map((item) => ({
    id: item.id,
    name: item.name,
    namePersian: item.namePersian ?? item.name,
  }));
}

export function getCatalogMaxPrice(catalog: Product[]): number {
  if (catalog.length === 0) return 0;
  return Math.max(...catalog.map((p) => p.price));
}

export function getBestsellerProducts(catalog: Product[], limit = 10): Product[] {
  const flagged = catalog.filter((p) => p.bestseller);
  const rest = [...catalog]
    .filter((p) => !p.bestseller)
    .sort((a, b) => merchandiseScore(b) - merchandiseScore(a));
  return [...flagged, ...rest].slice(0, limit);
}

export function getSliderProducts(catalog: Product[], limit = 6): Product[] {
  const seen = new Set<string>();
  const ordered = [...catalog].sort((a, b) => merchandiseScore(b) - merchandiseScore(a));
  const result: Product[] = [];
  for (const product of ordered) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
    if (result.length >= limit) break;
  }
  return result;
}

export function getFeaturedRailProducts(catalog: Product[], limit = 10): Product[] {
  const featured = catalog.filter((p) => p.featured);
  const rest = catalog.filter((p) => !p.featured);
  return [...featured, ...rest].slice(0, limit);
}

export function getRelatedProducts(catalog: Product[], id: string, limit = 4): Product[] {
  const product = catalog.find((item) => item.id === id);
  if (!product) return catalog.slice(0, limit);
  return catalog
    .filter((item) => item.id !== id)
    .filter((item) => item.collection === product.collection || item.category === product.category)
    .slice(0, limit);
}
