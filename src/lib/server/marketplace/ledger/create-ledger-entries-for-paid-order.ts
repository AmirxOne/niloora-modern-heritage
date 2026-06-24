import type { Prisma } from "@prisma/client";
import { calculateCommission } from "@/lib/server/marketplace/commission/calculate-commission";
import { resolveCommissionRule } from "@/lib/server/marketplace/commission/resolve-commission-rule";
import type { OrderForFinalization } from "@/lib/server/orders/finalize-paid-order";

type PrismaTx = Prisma.TransactionClient;

export type CreateLedgerEntriesResult = {
  created: number;
  skipped: number;
};

export async function createLedgerEntriesForPaidOrder(
  tx: PrismaTx,
  order: OrderForFinalization
): Promise<CreateLedgerEntriesResult> {
  const vendorItems = order.items.filter((item) => item.vendorId != null);
  if (vendorItems.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const orderRow = await tx.order.findUnique({
    where: { id: order.id },
    select: { finalizedAt: true },
  });
  const eventTime = orderRow?.finalizedAt ?? new Date();

  let created = 0;
  let skipped = 0;

  for (const item of vendorItems) {
    const vendorId = item.vendorId!;
    const grossAmount = item.price * item.quantity;

    const existing = await tx.vendorPayoutLedger.findUnique({
      where: { orderItemId: item.id },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const rule = await resolveCommissionRule(tx, vendorId, eventTime);
    const { commissionAmount, netAmount } = calculateCommission(
      grossAmount,
      rule,
      item.quantity
    );

    await tx.vendorPayoutLedger.create({
      data: {
        orderId: order.id,
        orderItemId: item.id,
        vendorId,
        grossAmount,
        commissionAmount,
        netAmount,
        commissionRuleId: rule.id,
        commissionType: rule.commissionType,
        commissionRateBps: rule.commissionType === "percentage" ? rule.value : null,
        status: "pending",
      },
    });

    created += 1;
  }

  return { created, skipped };
}
