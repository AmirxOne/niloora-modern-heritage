import { prisma } from "@/lib/server/prisma";
import { ORDER_STATUS } from "@/lib/server/commerce/statuses";
import { commitInventoryForPaidOrder } from "@/lib/server/inventory/commit-order-inventory";
import { logPaymentEvent } from "@/lib/server/payment/log";

export type RetryPendingInventoryResult = {
  scanned: number;
  committed: number;
  failed: number;
  skipped: number;
};

export async function retryPendingOrderInventory(
  limit = 50
): Promise<RetryPendingInventoryResult> {
  const orders = await prisma.order.findMany({
    where: {
      orderType: "product",
      status: ORDER_STATUS.processing,
      inventoryCommittedAt: null,
      finalizedAt: { not: null },
      payment: { status: "paid" },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let committed = 0;
  let failed = 0;
  let skipped = 0;

  for (const order of orders) {
    try {
      let wasSkipped = false;
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.order.findUnique({
          where: { id: order.id },
          select: { inventoryCommittedAt: true },
        });
        if (fresh?.inventoryCommittedAt) {
          wasSkipped = true;
          return;
        }

        await commitInventoryForPaidOrder(tx, order.items, order.id);
        await tx.order.update({
          where: { id: order.id },
          data: { inventoryCommittedAt: new Date() },
        });
      });

      if (wasSkipped) {
        skipped += 1;
        continue;
      }

      committed += 1;
      await logPaymentEvent({
        orderId: order.id,
        level: "info",
        event: "inventory.retry.success",
        message: "Deferred inventory commit succeeded",
      });
    } catch (error) {
      failed += 1;
      await logPaymentEvent({
        orderId: order.id,
        level: "error",
        event: "inventory.retry.failed",
        message: error instanceof Error ? error.message : "inventory retry failed",
      });
    }
  }

  return {
    scanned: orders.length,
    committed,
    failed,
    skipped,
  };
}
