import { prisma } from "@/lib/server/prisma";

export type AdminDemandProductRow = {
  productId: string;
  name: string;
  wishlistCount: number;
  pendingBackInStockCount: number;
  demandScore: number;
};

export type AdminDemandSearchRow = {
  query: string;
  count: number;
  isPlaceholder: true;
};

export type AdminDemandAnalyticsDto = {
  topProducts: AdminDemandProductRow[];
  topSearches: AdminDemandSearchRow[];
};

const PLACEHOLDER_TOP_SEARCHES: AdminDemandSearchRow[] = [
  { query: "انگشتر فیروزه", count: 0, isPlaceholder: true },
  { query: "گردنبند طلا", count: 0, isPlaceholder: true },
  { query: "دستبند نقره", count: 0, isPlaceholder: true },
  { query: "گوشواره عقیق", count: 0, isPlaceholder: true },
  { query: "انگشتر مردانه", count: 0, isPlaceholder: true },
];

function readWishlistIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

async function aggregateWishlistCounts(): Promise<Map<string, number>> {
  const prefs = await prisma.userPreference.findMany({
    select: { wishlistIds: true },
  });
  const counts = new Map<string, number>();
  for (const pref of prefs) {
    for (const productId of readWishlistIds(pref.wishlistIds)) {
      counts.set(productId, (counts.get(productId) ?? 0) + 1);
    }
  }
  return counts;
}

async function aggregatePendingBackInStockCounts(): Promise<Map<string, number>> {
  const groups = await prisma.backInStockAlert.groupBy({
    by: ["productId"],
    where: { status: "pending" },
    _count: { _all: true },
  });
  const counts = new Map<string, number>();
  for (const row of groups) {
    counts.set(row.productId, row._count._all);
  }
  return counts;
}

export async function getAdminDemandAnalytics(limit = 10): Promise<AdminDemandAnalyticsDto> {
  const take = Math.min(50, Math.max(1, limit));
  const [wishlistCounts, alertCounts] = await Promise.all([
    aggregateWishlistCounts(),
    aggregatePendingBackInStockCounts(),
  ]);

  const productIds = new Set<string>([
    ...Array.from(wishlistCounts.keys()),
    ...Array.from(alertCounts.keys()),
  ]);
  const products =
    productIds.size > 0
      ? await prisma.product.findMany({
          where: { id: { in: Array.from(productIds) } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const rows: AdminDemandProductRow[] = Array.from(productIds)
    .map((productId) => {
      const wishlistCount = wishlistCounts.get(productId) ?? 0;
      const pendingBackInStockCount = alertCounts.get(productId) ?? 0;
      return {
        productId,
        name: nameById.get(productId) ?? productId,
        wishlistCount,
        pendingBackInStockCount,
        demandScore: wishlistCount + pendingBackInStockCount,
      };
    })
    .filter((row) => row.demandScore > 0)
    .sort((a, b) => {
      if (b.demandScore !== a.demandScore) return b.demandScore - a.demandScore;
      if (b.wishlistCount !== a.wishlistCount) return b.wishlistCount - a.wishlistCount;
      return b.pendingBackInStockCount - a.pendingBackInStockCount;
    })
    .slice(0, take);

  return {
    topProducts: rows,
    topSearches: PLACEHOLDER_TOP_SEARCHES,
  };
}
