import { isMarketplaceRankingEnabled } from "@/lib/server/marketplace/feature-flags";
import { getVendorTrustScores } from "@/lib/server/marketplace/vendor-trust-service";

const MS_PER_DAY = 86_400_000;
const COLD_START_DAYS = 14;
const COLD_START_BOOST = 12;
const DEFAULT_VENDOR_TRUST = 55;

export type ProductRankInput = {
  id: string;
  createdAt: Date;
  initialSalesCount: number;
  featured: boolean;
  bestseller: boolean;
  stock: number;
  vendorTrust?: number;
};

function popularityScore(input: ProductRankInput): number {
  const sales = Math.min(Math.max(0, input.initialSalesCount), 500);
  const salesNorm = sales / 500;
  const bestsellerBoost = input.bestseller ? 0.35 : 0;
  return Math.min(1, salesNorm * 0.65 + bestsellerBoost);
}

function recencyScore(input: ProductRankInput, now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - input.createdAt.getTime()) / MS_PER_DAY);
  if (ageDays <= COLD_START_DAYS) return 1;
  const decay = Math.min(ageDays / 180, 1);
  return 1 - decay * 0.85;
}

function coldStartBoost(input: ProductRankInput, now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - input.createdAt.getTime()) / MS_PER_DAY);
  return ageDays <= COLD_START_DAYS ? COLD_START_BOOST : 0;
}

export function computeProductRankScore(
  input: ProductRankInput,
  now: Date = new Date()
): number {
  const trust = (input.vendorTrust ?? DEFAULT_VENDOR_TRUST) / 100;
  const featured = input.featured ? 1 : 0;
  const inStock = input.stock > 0 ? 1 : 0;

  const base =
    popularityScore(input) * 0.3 +
    recencyScore(input, now) * 0.2 +
    trust * 0.25 +
    featured * 0.15 +
    inStock * 0.1;

  return base * 100 + coldStartBoost(input, now);
}

export function sortRankInputs<T extends ProductRankInput>(
  items: T[],
  now: Date = new Date()
): T[] {
  if (!isMarketplaceRankingEnabled()) {
    return items;
  }

  return [...items].sort(
    (a, b) => computeProductRankScore(b, now) - computeProductRankScore(a, now)
  );
}

export function sortProductsByRankScore<T extends { id: string }>(
  products: T[],
  rankInputs: Map<string, ProductRankInput>,
  now: Date = new Date()
): T[] {
  if (!isMarketplaceRankingEnabled()) {
    return products;
  }

  return [...products].sort((a, b) => {
    const scoreA = computeProductRankScore(
      rankInputs.get(a.id) ?? {
        id: a.id,
        createdAt: now,
        initialSalesCount: 0,
        featured: false,
        bestseller: false,
        stock: 0,
      },
      now
    );
    const scoreB = computeProductRankScore(
      rankInputs.get(b.id) ?? {
        id: b.id,
        createdAt: now,
        initialSalesCount: 0,
        featured: false,
        bestseller: false,
        stock: 0,
      },
      now
    );
    return scoreB - scoreA;
  });
}

export type RankableCatalogRow = {
  id: string;
  createdAt: Date;
  initialSalesCount: number | null;
  featured: boolean;
  bestseller: boolean;
  stock: number;
  vendorId: string | null;
};

export async function rankCatalogRows<T extends RankableCatalogRow>(
  rows: T[],
  now: Date = new Date()
): Promise<T[]> {
  if (!isMarketplaceRankingEnabled()) {
    return rows;
  }

  const vendorIds = rows
    .map((row) => row.vendorId)
    .filter((id): id is string => Boolean(id));
  const trustScores = await getVendorTrustScores(vendorIds);

  const rankInputs = new Map<string, ProductRankInput>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        createdAt: row.createdAt,
        initialSalesCount: row.initialSalesCount ?? 0,
        featured: row.featured,
        bestseller: row.bestseller,
        stock: row.stock,
        vendorTrust: row.vendorId ? trustScores.get(row.vendorId) : undefined,
      },
    ])
  );

  return sortProductsByRankScore(rows, rankInputs, now);
}
