import type { Prisma } from "@prisma/client";
import type { PreOwnedInfo, Product } from "@/lib/types";
import {
  getCatalogMaxPrice as resolveCatalogMaxPrice,
  normalizeCatalogProductPricing,
} from "@/lib/catalog/product-catalog";
import { DEFAULT_PRODUCT_IMAGE, resolvePublicImagePath } from "@/lib/images";
import { mapProductMarketplaceFields } from "@/lib/server/marketplace/map-product-marketplace-fields";
import { mapProductVendorSummary } from "@/lib/server/marketplace/map-product-vendor";
import { mergePublicCatalogWhere } from "@/lib/server/marketplace/catalog-filter";
import { rankCatalogRows } from "@/lib/server/marketplace/product-rank";
import { prisma } from "@/lib/server/prisma";
const preOwnedGrades = new Set(["excellent", "very-good", "good"]);

const productInclude = {
  listing: true,
  preOwnedInfo: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  collection: true,
  vendor: { select: { id: true, slug: true, displayName: true, displayNameFa: true, status: true } },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

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

function parseRingSize(value: string): number | undefined {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\//g, ".")
    .replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function deriveListingMetadata(details: string[]): Pick<
  Product,
  "craftedBy" | "stoneColorLabel" | "ringSize" | "artisanAssignments"
> {
  let craftedBy: string | undefined;
  let stoneColorLabel: string | undefined;
  let ringSize: number | undefined;

  for (const line of details) {
    const value = line.trim();
    if (value.startsWith("رکاب:")) {
      const maker = value.replace("رکاب:", "").trim();
      if (maker) craftedBy = maker;
    }
    if (value.startsWith("نگین:")) {
      const stoneParts = value
        .replace("نگین:", "")
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean);
      if (stoneParts.length >= 2) {
        stoneColorLabel = stoneParts[1];
      }
    }
    if (value.startsWith("سایز:")) {
      const parsedSize = parseRingSize(value.replace("سایز:", "").trim());
      if (parsedSize) ringSize = parsedSize;
    }
  }

  const artisanAssignments: Product["artisanAssignments"] = {};
  if (craftedBy?.includes("ابراهیم")) artisanAssignments.shankDesignerId = "ebrahim-azari";
  else if (craftedBy?.includes("تهرانی")) artisanAssignments.shankDesignerId = "tehrani-azari";
  else if (craftedBy?.includes("میراث")) artisanAssignments.shankDesignerId = "heritage-atelier";

  return {
    craftedBy,
    stoneColorLabel,
    ringSize,
    artisanAssignments: Object.keys(artisanAssignments).length > 0 ? artisanAssignments : undefined,
  };
}

export function mapDbProduct(product: DbProduct): Product {
  // PURPOSE: isolate DB-to-domain mapping so UI never depends on Prisma shapes.
  const preOwnedGrade = product.preOwnedInfo?.grade ?? "good";
  const pricing = normalizeCatalogProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
  });
  const listingDetails = Array.isArray(product.listing?.details) ? (product.listing.details as string[]) : [];
  const derived = deriveListingMetadata(listingDetails);

  return {
    id: product.id,
    name: product.name,
    namePersian: product.namePersian,
    introVideoUrl: product.introVideoUrl ?? undefined,
    ...mapProductMarketplaceFields(product),
    ...(product.vendorId ? { vendor: mapProductVendorSummary(product.vendor) } : {}),
    listing: {
      tier: product.listing?.tier === "economy" ? "economy" : "premium",
      headline: product.listing?.headline ?? "",
      details: listingDetails,
      extraTags: Array.isArray(product.listing?.extraTags)
        ? (product.listing?.extraTags as ("pre-owned")[])
        : undefined,
    },
    ...pricing,
    image: resolvePublicImagePath(product.image, DEFAULT_PRODUCT_IMAGE),
    images: product.images.map((item) => resolvePublicImagePath(item.url, "")).filter(Boolean),
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
    craftedBy: derived.craftedBy,
    stoneColorLabel: derived.stoneColorLabel,
    ringSize: derived.ringSize,
    artisanAssignments: derived.artisanAssignments,
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

export type CatalogProductsOptions = {
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type CatalogProductsPage = {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor: string | null;
};

const catalogListOrderBy = [
  { featured: "desc" as const },
  { updatedAt: "desc" as const },
  { id: "asc" as const },
];

async function fetchCatalogRows(query: {
  where: Prisma.ProductWhereInput;
  skip?: number;
  take?: number;
  cursor?: { id: string };
}) {
  const base = {
    where: query.where,
    orderBy: catalogListOrderBy,
    ...(query.cursor
      ? { cursor: query.cursor, skip: 1, take: query.take }
      : { skip: query.skip, take: query.take }),
  };

  return prisma.product.findMany({ ...base, include: productInclude });
}

async function getCatalogProductsPage(
  options: CatalogProductsOptions
): Promise<CatalogProductsPage> {
  const catalogWhere = mergePublicCatalogWhere();
  const limit = Math.min(100, Math.max(1, options.limit ?? 24));
  const offset = Math.max(0, options.offset ?? 0);

  const [total, rows] = await Promise.all([
    prisma.product.count({ where: catalogWhere }),
    fetchCatalogRows({
      where: catalogWhere,
      ...(options.cursor
        ? { cursor: { id: options.cursor }, take: limit }
        : { skip: offset, take: limit }),
    }),
  ]);

  const products = rows.map(mapDbProduct);

  const lastId = products.at(-1)?.id ?? null;
  const hasMore = options.cursor
    ? products.length === limit
    : offset + products.length < total;

  return {
    products,
    total,
    limit,
    offset,
    hasMore,
    nextCursor: hasMore ? lastId : null,
  };
}

export async function getCatalogProducts(): Promise<Product[]>;
export async function getCatalogProducts(
  options: CatalogProductsOptions
): Promise<Product[] | CatalogProductsPage>;
export async function getCatalogProducts(
  options?: CatalogProductsOptions
): Promise<Product[] | CatalogProductsPage> {
  if (options?.limit != null || options?.cursor) {
    return getCatalogProductsPage(options);
  }
  return fetchFullCatalogProducts();
}

export async function getCatalogMaxPriceFromDb(): Promise<number> {
  const catalogWhere = mergePublicCatalogWhere();
  const agg = await prisma.product.aggregate({
    where: catalogWhere,
    _max: { price: true },
  });
  return agg._max.price ?? 0;
}

async function fetchFullCatalogProducts(): Promise<Product[]> {
  const catalogWhere = mergePublicCatalogWhere();
  const rows = await rankCatalogRows(
    await prisma.product.findMany({
      where: catalogWhere,
      include: productInclude,
    })
  );
  return rows.map(mapDbProduct);
}

export async function getProductByIdFromDb(id: string): Promise<Product | null> {
  const catalogWhere = mergePublicCatalogWhere({ id });
  const row = await prisma.product.findFirst({
    where: catalogWhere,
    include: productInclude,
  });
  return row ? mapDbProduct(row) : null;
}

export async function getPreOwnedProductsFromDb(): Promise<Product[]> {
  const catalogWhere = mergePublicCatalogWhere({ condition: "pre-owned" });
  const rows = await prisma.product.findMany({
    where: catalogWhere,
    include: productInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapDbProduct);
}

export async function getSameVendorProductsFromDb(
  vendorId: string,
  excludeProductId: string,
  limit = 8
): Promise<Product[]> {
  const catalogWhere = mergePublicCatalogWhere({
    vendorId,
    id: { not: excludeProductId },
  });
  const take = Math.min(8, Math.max(1, limit));
  const rows = await prisma.product.findMany({
    where: catalogWhere,
    orderBy: [{ featured: "desc" as const }, { updatedAt: "desc" as const }],
    take,
    include: productInclude,
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
