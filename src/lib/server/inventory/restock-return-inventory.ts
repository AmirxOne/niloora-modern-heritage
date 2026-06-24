import type { PrismaClient } from "@prisma/client";
import { INVENTORY_LOG_REASON, PRODUCT_AVAILABILITY } from "@/lib/server/commerce/statuses";
import { reverseLedgerEntriesForOrderItemIds } from "@/lib/server/marketplace/ledger/reverse-ledger-entries-for-order-items";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export async function restockInventoryForApprovedReturn(
  tx: PrismaTx,
  returnId: string
): Promise<{ restockedLines: number }> {
  const returnRow = await tx.orderReturn.findUnique({
    where: { id: returnId },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          quantity: true,
          orderItem: {
            select: { id: true, productId: true },
          },
        },
      },
    },
  });

  if (!returnRow || returnRow.status !== "approved") {
    return { restockedLines: 0 };
  }

  let restockedLines = 0;

  for (const line of returnRow.items) {
    const productId = line.orderItem.productId;
    if (!productId) continue;

    const existing = await tx.inventoryLog.findFirst({
      where: {
        orderReturnId: returnId,
        productId,
        reason: INVENTORY_LOG_REASON.returnApproved,
      },
      select: { id: true },
    });
    if (existing) continue;

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, availability: true },
    });
    if (!product) continue;

    const nextStock = product.stock + line.quantity;
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: line.quantity },
        ...(product.availability === PRODUCT_AVAILABILITY.sold && nextStock > 0
          ? { availability: PRODUCT_AVAILABILITY.ready }
          : {}),
      },
    });

    await tx.inventoryLog.create({
      data: {
        productId,
        change: line.quantity,
        reason: INVENTORY_LOG_REASON.returnApproved,
        orderReturnId: returnId,
      },
    });

    restockedLines += 1;
  }

  const orderItemIds = returnRow.items.map((line) => line.orderItem.id);
  await reverseLedgerEntriesForOrderItemIds(tx, orderItemIds);

  return { restockedLines };
}
