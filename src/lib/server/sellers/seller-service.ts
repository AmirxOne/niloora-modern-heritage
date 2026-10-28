import { prisma } from "@/lib/server/prisma";
import { serverLogger } from "@/lib/observability/logger";

/**
 * Seller domain service: shop registration, catalog access, ledger.
 * Products with sellerId = null belong to the platform (the gallery itself).
 */

export const SELLER_STATUSES = ["pending", "active", "suspended"] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export function normalizeSellerSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export type SellerPublicDto = {
  id: string;
  shopName: string;
  slug: string;
  bio: string | null;
  logoUrl: string | null;
  status: SellerStatus;
  productCount: number;
  createdAt: string;
};

export function toSellerPublicDto(row: {
  id: string;
  shopName: string;
  slug: string;
  bio: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: Date;
  _count?: { products: number };
}): SellerPublicDto {
  return {
    id: row.id,
    shopName: row.shopName,
    slug: row.slug,
    bio: row.bio,
    logoUrl: row.logoUrl,
    status: (SELLER_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as SellerStatus)
      : "pending",
    productCount: row._count?.products ?? 0,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Register a shop for the logged-in user (one shop per user). */
export async function registerSeller(input: {
  userId: string;
  shopName: string;
  slug: string;
  bio?: string | null;
  phone?: string | null;
}): Promise<
  | { ok: true; seller: { id: string; status: string } }
  | { ok: false; reason: "slug_taken" | "already_seller" | "invalid" }
> {
  const shopName = input.shopName?.trim() ?? "";
  const slug = normalizeSellerSlug(input.slug || shopName);
  if (shopName.length < 3 || slug.length < 3) {
    return { ok: false, reason: "invalid" };
  }

  const existing = await prisma.seller.findUnique({ where: { userId: input.userId } });
  if (existing) return { ok: false, reason: "already_seller" };

  const slugTaken = await prisma.seller.findUnique({ where: { slug } });
  if (slugTaken) return { ok: false, reason: "slug_taken" };

  const seller = await prisma.seller.create({
    data: {
      userId: input.userId,
      shopName,
      slug,
      bio: input.bio?.trim() || null,
      phone: input.phone?.trim() || null,
      status: "pending", // requires admin approval
    },
  });

  serverLogger.info("seller registered", { sellerId: seller.id, slug });
  return { ok: true, seller: { id: seller.id, status: seller.status } };
}

/** Seller's own shop + stats (works even while pending/suspended). */
export async function getSellerOverview(sellerId: string) {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
    include: {
      _count: { select: { products: true } },
    },
  });
  if (!seller) return null;

  const [productStats, orderItemStats, balance] = await Promise.all([
    prisma.product.aggregate({
      where: { sellerId },
      _count: true,
    }),
    prisma.orderItem.aggregate({
      where: { product: { sellerId }, order: { status: { in: ["processing", "crafting", "shipped", "delivered"] } } },
      _sum: { quantity: true },
    }),
    getSellerBalance(sellerId),
  ]);

  return {
    seller: toSellerPublicDto(seller),
    stats: {
      products: productStats._count,
      soldItems: orderItemStats._sum.quantity ?? 0,
      balanceToman: balance.balanceToman,
      lifetimeCreditToman: balance.lifetimeCreditToman,
      pendingPayoutToman: balance.pendingPayoutToman,
    },
  };
}

/** Ledger balance: credits - paid payouts (pending payouts not yet deducted). */
export async function getSellerBalance(sellerId: string): Promise<{
  balanceToman: number;
  lifetimeCreditToman: number;
  pendingPayoutToman: number;
}> {
  const [credits, paidOut, pending] = await Promise.all([
    prisma.sellerLedgerEntry.aggregate({
      where: { sellerId, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.sellerPayout.aggregate({
      where: { sellerId, status: "paid" },
      _sum: { amount: true },
    }),
    prisma.sellerPayout.aggregate({
      where: { sellerId, status: { in: ["requested", "approved"] } },
      _sum: { amount: true },
    }),
  ]);

  const lifetimeCredit = credits._sum.amount ?? 0;
  const paid = paidOut._sum.amount ?? 0;
  const pendingPayout = pending._sum.amount ?? 0;

  return {
    balanceToman: Math.max(0, lifetimeCredit - paid - pendingPayout),
    lifetimeCreditToman: lifetimeCredit,
    pendingPayoutToman: pendingPayout,
  };
}

/**
 * Credit seller shares for a finalized (paid) order — called once per order
 * from the payment finalize path. Idempotent per (sellerId, orderId).
 */
export async function creditSellersForOrder(orderId: string): Promise<void> {
  const items = await prisma.orderItem.findMany({
    where: { orderId, productId: { not: null }, product: { sellerId: { not: null } } },
    include: { product: { include: { seller: true } } },
  });

  const perSeller = new Map<string, { amount: number; commission: number }>();
  for (const item of items) {
    const seller = item.product?.seller;
    if (!seller || seller.status !== "active") continue;
    const lineTotal = item.price * item.quantity;
    const prev = perSeller.get(seller.id) ?? { amount: 0, commission: seller.commissionPercent };
    prev.amount += lineTotal;
    perSeller.set(seller.id, prev);
  }

  for (const entry of Array.from(perSeller)) {
    const sellerId = entry[0];
    const { amount, commission } = entry[1];
    // dedupe: one credit row per (seller, order)
    const existing = await prisma.sellerLedgerEntry.findFirst({
      where: { sellerId, orderId, kind: "sale_credit" },
      select: { id: true },
    });
    if (existing) continue;

    const sellerShare = Math.round(amount * (1 - commission / 100));
    await prisma.sellerLedgerEntry.create({
      data: {
        sellerId,
        orderId,
        kind: "sale_credit",
        amount: sellerShare,
        note: `سهم فروشنده از سفارش ${orderId} (کمیسیون ${commission}٪)`,
      },
    });
    serverLogger.info("seller sale credited", { sellerId, orderId, sellerShare });
  }
}
