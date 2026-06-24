import { prisma } from "@/lib/server/prisma";
import {
  computeVendorTrustScore,
  type VendorTrustInput,
} from "@/lib/server/marketplace/vendor-trust";
import type { VendorStatus } from "@/lib/types/vendor";

async function loadAvgCommentRating(vendorId: string): Promise<number | null> {
  const agg = await prisma.productComment.aggregate({
    where: {
      status: "approved",
      product: { vendorId },
    },
    _avg: { rating: true },
  });
  return agg._avg.rating;
}

async function loadReturnRate(vendorId: string): Promise<number | null> {
  const [returnedItems, soldItems] = await Promise.all([
    prisma.orderReturnItem.count({
      where: {
        orderItem: { vendorId },
        return: { status: { in: ["approved", "refunded", "completed"] } },
      },
    }),
    prisma.orderItem.count({
      where: { vendorId },
    }),
  ]);

  if (soldItems === 0) return null;
  return returnedItems / soldItems;
}

export async function getVendorTrustScore(vendorId: string): Promise<number> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      status: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  if (!vendor) return 0;

  const [avgCommentRating, returnRate] = await Promise.all([
    loadAvgCommentRating(vendorId),
    loadReturnRate(vendorId),
  ]);

  const input: VendorTrustInput = {
    status: vendor.status as VendorStatus,
    approvedAt: vendor.approvedAt,
    createdAt: vendor.createdAt,
    avgCommentRating,
    returnRate,
  };

  return computeVendorTrustScore(input);
}

export async function getVendorTrustScores(
  vendorIds: string[]
): Promise<Map<string, number>> {
  const uniqueIds = Array.from(new Set(vendorIds.filter(Boolean)));
  const scores = new Map<string, number>();
  if (uniqueIds.length === 0) return scores;

  await Promise.all(
    uniqueIds.map(async (vendorId) => {
      scores.set(vendorId, await getVendorTrustScore(vendorId));
    })
  );

  return scores;
}
