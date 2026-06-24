import { prisma } from "@/lib/server/prisma";
import type {
  AdminVendorFinanceDto,
  AdminVendorFinancePlatformDto,
  AdminVendorFinanceRowDto,
} from "@/lib/server/marketplace/payout/admin-vendor-finance-dto";

const PENDING_STATUSES = ["pending", "eligible"] as const;
const TOP_VENDOR_LIMIT = 10;

type VendorAggRow = {
  vendorId: string;
  _sum: {
    grossAmount: number | null;
    commissionAmount: number | null;
    netAmount: number | null;
  };
  _count: { _all: number };
};

async function loadVendorOrderCounts(): Promise<Map<string, number>> {
  const rows = await prisma.vendorPayoutLedger.groupBy({
    by: ["vendorId", "orderId"],
    where: { vendorId: { not: null }, status: { not: "reversed" } },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.vendorId) continue;
    counts.set(row.vendorId, (counts.get(row.vendorId) ?? 0) + 1);
  }
  return counts;
}

async function loadPendingNetByVendor(): Promise<Map<string, number>> {
  const rows = await prisma.vendorPayoutLedger.groupBy({
    by: ["vendorId"],
    where: { vendorId: { not: null }, status: { in: [...PENDING_STATUSES] } },
    _sum: { netAmount: true },
  });

  return new Map(
    rows
      .filter((row) => row.vendorId)
      .map((row) => [row.vendorId!, row._sum.netAmount ?? 0])
  );
}

function buildPlatformTotals(
  grossRows: VendorAggRow[],
  orderCounts: Map<string, number>,
  pendingByVendor: Map<string, number>
): AdminVendorFinancePlatformDto {
  let grossAmount = 0;
  let commissionAmount = 0;
  let netPending = 0;

  for (const row of grossRows) {
    grossAmount += row._sum.grossAmount ?? 0;
    commissionAmount += row._sum.commissionAmount ?? 0;
    netPending += pendingByVendor.get(row.vendorId) ?? 0;
  }

  const orderCount = Array.from(orderCounts.values()).reduce((sum, count) => sum + count, 0);

  return { grossAmount, commissionAmount, netPending, orderCount };
}

export async function getAdminVendorFinance(): Promise<AdminVendorFinanceDto> {
  const [grossRows, orderCounts, pendingByVendor] = await Promise.all([
    prisma.vendorPayoutLedger.groupBy({
      by: ["vendorId"],
      where: { vendorId: { not: null }, status: { not: "reversed" } },
      _sum: { grossAmount: true, commissionAmount: true, netAmount: true },
      _count: { _all: true },
    }),
    loadVendorOrderCounts(),
    loadPendingNetByVendor(),
  ]);

  const vendorIds = grossRows.map((row) => row.vendorId).filter(Boolean) as string[];

  const vendorProfiles =
    vendorIds.length > 0
      ? await prisma.vendor.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, displayName: true, displayNameFa: true, slug: true },
        })
      : [];

  const profileById = new Map(vendorProfiles.map((v) => [v.id, v]));

  const vendorRows: AdminVendorFinanceRowDto[] = grossRows
    .filter((row) => row.vendorId)
    .map((row) => {
      const profile = profileById.get(row.vendorId!);
      return {
        vendorId: row.vendorId!,
        displayName: profile?.displayName ?? row.vendorId!,
        displayNameFa: profile?.displayNameFa ?? null,
        slug: profile?.slug ?? row.vendorId!,
        grossAmount: row._sum.grossAmount ?? 0,
        commissionAmount: row._sum.commissionAmount ?? 0,
        netPending: pendingByVendor.get(row.vendorId!) ?? 0,
        orderCount: orderCounts.get(row.vendorId!) ?? 0,
      };
    })
    .sort((a, b) => b.grossAmount - a.grossAmount);

  const platform = buildPlatformTotals(
    grossRows as VendorAggRow[],
    orderCounts,
    pendingByVendor
  );

  return {
    platform,
    vendors: vendorRows,
    topByGross: vendorRows.slice(0, TOP_VENDOR_LIMIT),
  };
}
