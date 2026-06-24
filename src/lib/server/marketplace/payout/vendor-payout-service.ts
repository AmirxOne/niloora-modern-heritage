import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import type {
  VendorPayoutEntryDto,
  VendorPayoutsDto,
  VendorPayoutsSummaryDto,
} from "@/lib/server/marketplace/payout/vendor-payout-dto";

const PENDING_STATUSES = ["pending", "eligible"] as const;
const EARNED_STATUSES = ["pending", "eligible", "paid"] as const;

const ledgerEntrySelect = {
  id: true,
  orderId: true,
  orderItemId: true,
  createdAt: true,
  grossAmount: true,
  commissionAmount: true,
  netAmount: true,
  status: true,
  paidAt: true,
  reversedAt: true,
  order: { select: { finalizedAt: true } },
} satisfies Prisma.VendorPayoutLedgerSelect;

function toEntryDto(
  row: Prisma.VendorPayoutLedgerGetPayload<{ select: typeof ledgerEntrySelect }>
): VendorPayoutEntryDto {
  return {
    id: row.id,
    orderId: row.orderId,
    orderItemId: row.orderItemId,
    createdAt: row.createdAt.toISOString(),
    orderFinalizedAt: row.order.finalizedAt?.toISOString() ?? null,
    grossAmount: row.grossAmount,
    commissionAmount: row.commissionAmount,
    netAmount: row.netAmount,
    status: row.status,
    paidAt: row.paidAt?.toISOString() ?? null,
    reversedAt: row.reversedAt?.toISOString() ?? null,
  };
}

export async function sumVendorPayoutTotals(vendorId: string): Promise<VendorPayoutsSummaryDto> {
  const [pendingAgg, paidAgg, earnedAgg] = await Promise.all([
    prisma.vendorPayoutLedger.aggregate({
      where: { vendorId, status: { in: [...PENDING_STATUSES] } },
      _sum: { netAmount: true },
    }),
    prisma.vendorPayoutLedger.aggregate({
      where: { vendorId, status: "paid" },
      _sum: { netAmount: true },
    }),
    prisma.vendorPayoutLedger.aggregate({
      where: { vendorId, status: { in: [...EARNED_STATUSES] } },
      _sum: { netAmount: true },
    }),
  ]);

  return {
    pendingTotal: pendingAgg._sum.netAmount ?? 0,
    paidTotal: paidAgg._sum.netAmount ?? 0,
    earnedTotal: earnedAgg._sum.netAmount ?? 0,
  };
}

export type VendorPayoutListOptions = {
  page?: number;
  pageSize?: number;
};

export async function listVendorPayouts(
  vendorId: string,
  options: VendorPayoutListOptions = {}
): Promise<VendorPayoutsDto> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const paginate = options.page != null || options.pageSize != null;

  const where: Prisma.VendorPayoutLedgerWhereInput = { vendorId };

  const [totals, total, rows] = await Promise.all([
    sumVendorPayoutTotals(vendorId),
    paginate ? prisma.vendorPayoutLedger.count({ where }) : Promise.resolve(0),
    paginate
      ? prisma.vendorPayoutLedger.findMany({
          where,
          select: ledgerEntrySelect,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      : prisma.vendorPayoutLedger.findMany({
          where,
          select: ledgerEntrySelect,
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
  ]);

  const result: VendorPayoutsDto = {
    ...totals,
    entries: rows.map(toEntryDto),
  };

  if (paginate) {
    result.pagination = {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  return result;
}
