import type { Prisma } from "@prisma/client";
import type { PreOwnedInfo, Product, ProductUgcMediaStatus, ProductUgcMediaType } from "@/lib/types";
import {
  getCatalogMaxPrice as resolveCatalogMaxPrice,
  normalizeCatalogProductPricing,
} from "@/lib/catalog/product-catalog";
import { prisma } from "@/lib/server/prisma";
const preOwnedGrades = new Set(["excellent", "very-good", "good"]);

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  collection: true,
  ugcMedia: {
    where: { status: "approved" },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
} satisfies Prisma.ProductInclude;

const productIncludeWithoutUgc = {
  listing: true,
  preOwnedInfo: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  collection: true,
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type DbProductWithoutUgc = Prisma.ProductGetPayload<{ include: typeof productIncludeWithoutUgc }>;

export type CollectionDto = {
  id: string;
  name: string;
  namePersian: string;
};

export type SmartRecommendationGroups = {
  similar: Product[];
  complementary: Product[];
  budget: Product[];
};

export type PreferenceProfileInput = {
  favoriteStone?: Product["stone"] | null;
  favoriteStyle?: Product["category"] | null;
  favoriteBudgetBand?: "entry" | "mid" | "premium" | "luxury" | null;
};

function merchandiseScore(product: Product): number {
  return (product.featured ? 4 : 0) + (product.bestseller ? 2 : 0);
}

export function mapDbProduct(product: DbProduct): Product {
  // PURPOSE: isolate DB-to-domain mapping so UI never depends on Prisma shapes.
  const preOwnedGrade = product.preOwnedInfo?.grade ?? "good";
  const pricing = normalizeCatalogProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
  });

  return {
    id: product.id,
    name: product.name,
    namePersian: product.namePersian,
    introVideoUrl: product.introVideoUrl ?? undefined,
    listing: {
      tier: product.listing?.tier === "economy" ? "economy" : "premium",
      headline: product.listing?.headline ?? "",
      details: Array.isArray(product.listing?.details) ? (product.listing?.details as string[]) : [],
      extraTags: Array.isArray(product.listing?.extraTags)
        ? (product.listing?.extraTags as ("pre-owned")[])
        : undefined,
    },
    ...pricing,
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
    discountEndsAt: product.discountEndsAt?.toISOString(),
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
    ugcMedia: product.ugcMedia.map((item) => ({
      id: item.id,
      productId: item.productId,
      userId: item.userId,
      orderId: item.orderId ?? undefined,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType as ProductUgcMediaType,
      caption: item.caption ?? undefined,
      status: item.status as ProductUgcMediaStatus,
      approvedAt: item.approvedAt?.toISOString(),
      rejectedAt: item.rejectedAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

function isMissingProductUgcTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message ?? "";
  return message.includes("ProductUgcMedia") && message.includes("does not exist");
}

function mapDbProductWithoutUgc(product: DbProductWithoutUgc): Product {
  const preOwnedGrade = product.preOwnedInfo?.grade ?? "good";
  const pricing = normalizeCatalogProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
  });

  return {
    id: product.id,
    name: product.name,
    namePersian: product.namePersian,
    introVideoUrl: product.introVideoUrl ?? undefined,
    listing: {
      tier: product.listing?.tier === "economy" ? "economy" : "premium",
      headline: product.listing?.headline ?? "",
      details: Array.isArray(product.listing?.details) ? (product.listing?.details as string[]) : [],
      extraTags: Array.isArray(product.listing?.extraTags)
        ? (product.listing?.extraTags as ("pre-owned")[])
        : undefined,
    },
    ...pricing,
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
    discountEndsAt: product.discountEndsAt?.toISOString(),
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
    ugcMedia: [],
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  // FLOW: read full catalog with include graph, then map to shared Product type.
  try {
    const rows = await prisma.product.findMany({
      include: productInclude,
    });
    return rows.map(mapDbProduct);
  } catch (error) {
    if (!isMissingProductUgcTable(error)) throw error;
    const rows = await prisma.product.findMany({
      include: productIncludeWithoutUgc,
    });
    return rows.map(mapDbProductWithoutUgc);
  }
}

export async function getProductByIdFromDb(id: string): Promise<Product | null> {
  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    return row ? mapDbProduct(row) : null;
  } catch (error) {
    if (!isMissingProductUgcTable(error)) throw error;
    const row = await prisma.product.findUnique({
      where: { id },
      include: productIncludeWithoutUgc,
    });
    return row ? mapDbProductWithoutUgc(row) : null;
  }
}

export async function getPreOwnedProductsFromDb(): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { condition: "pre-owned" },
      include: productInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapDbProduct);
  } catch (error) {
    if (!isMissingProductUgcTable(error)) throw error;
    const rows = await prisma.product.findMany({
      where: { condition: "pre-owned" },
      include: productIncludeWithoutUgc,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapDbProductWithoutUgc);
  }
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
  return resolveCatalogMaxPrice(catalog);
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

function takeUniqueProducts(
  pool: Product[],
  exclude: Set<string>,
  limit: number
): Product[] {
  const result: Product[] = [];
  for (const item of pool) {
    if (exclude.has(item.id)) continue;
    result.push(item);
    exclude.add(item.id);
    if (result.length >= limit) break;
  }
  return result;
}

function priceCloseness(a: number, b: number): number {
  if (!a || !b) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  return ratio;
}

function resolveBudgetBand(price: number): "entry" | "mid" | "premium" | "luxury" {
  if (price <= 40_000_000) return "entry";
  if (price <= 90_000_000) return "mid";
  if (price <= 180_000_000) return "premium";
  return "luxury";
}

function rankPreferenceMatch(candidate: Product, pref: PreferenceProfileInput): number {
  let score = 0;
  if (pref.favoriteStone && candidate.stone === pref.favoriteStone) score += 5;
  if (pref.favoriteStyle && candidate.category === pref.favoriteStyle) score += 5;
  if (pref.favoriteBudgetBand && resolveBudgetBand(candidate.price) === pref.favoriteBudgetBand) score += 4;
  if (candidate.featured) score += 2;
  if (candidate.bestseller) score += 1;
  return score;
}

function rankSimilar(target: Product, candidate: Product): number {
  let score = 0;
  if (target.collection && candidate.collection === target.collection) score += 6;
  if (candidate.category === target.category) score += 5;
  if (candidate.stone === target.stone) score += 3;
  if (candidate.metal === target.metal) score += 2;
  if (candidate.engravingType === target.engravingType) score += 1;
  score += Math.round(priceCloseness(target.price, candidate.price) * 4);
  return score;
}

function rankComplementary(target: Product, candidate: Product): number {
  let score = 0;
  if (candidate.category !== target.category) score += 5;
  if (candidate.stone === target.stone) score += 4;
  if (candidate.metal === target.metal) score += 3;
  if (candidate.collection === target.collection) score += 2;
  if (candidate.availability !== "sold") score += 1;
  score += Math.round(priceCloseness(target.price, candidate.price) * 3);
  return score;
}

export function getSmartRecommendations(
  catalog: Product[],
  id: string,
  limitPerGroup = 5
): SmartRecommendationGroups {
  const target = catalog.find((item) => item.id === id);
  if (!target) {
    return { similar: [], complementary: [], budget: [] };
  }

  const others = catalog.filter((item) => item.id !== id);
  const fallbackPool = [...others].sort((a, b) => merchandiseScore(b) - merchandiseScore(a));
  const used = new Set<string>([id]);

  const similarPool = [...others].sort((a, b) => rankSimilar(target, b) - rankSimilar(target, a));
  const similar = takeUniqueProducts(similarPool, used, limitPerGroup);
  if (similar.length < limitPerGroup) {
    similar.push(...takeUniqueProducts(fallbackPool, used, limitPerGroup - similar.length));
  }

  const complementaryPool = [...others]
    .filter((item) => !used.has(item.id))
    .sort((a, b) => rankComplementary(target, b) - rankComplementary(target, a));
  const complementary = takeUniqueProducts(complementaryPool, used, limitPerGroup);
  if (complementary.length < limitPerGroup) {
    complementary.push(
      ...takeUniqueProducts(fallbackPool, used, limitPerGroup - complementary.length)
    );
  }

  const budgetPool = [...others]
    .filter((item) => !used.has(item.id))
    .sort((a, b) => {
      const diffA = Math.abs(a.price - target.price);
      const diffB = Math.abs(b.price - target.price);
      if (diffA === diffB) return merchandiseScore(b) - merchandiseScore(a);
      return diffA - diffB;
    });
  const budget = takeUniqueProducts(budgetPool, used, limitPerGroup);
  if (budget.length < limitPerGroup) {
    budget.push(...takeUniqueProducts(fallbackPool, used, limitPerGroup - budget.length));
  }

  return { similar, complementary, budget };
}

export function getPreferenceRecommendations(
  catalog: Product[],
  pref: PreferenceProfileInput,
  limit = 8
): Product[] {
  const hasPreference = Boolean(pref.favoriteStone || pref.favoriteStyle || pref.favoriteBudgetBand);
  if (!hasPreference) return [];

  const scored = [...catalog]
    .map((item) => ({
      product: item,
      score: rankPreferenceMatch(item, pref),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score === a.score) return merchandiseScore(b.product) - merchandiseScore(a.product);
      return b.score - a.score;
    })
    .map((item) => item.product);

  return scored.slice(0, limit);
}
