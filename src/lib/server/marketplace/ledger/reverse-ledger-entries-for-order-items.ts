import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient | Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export async function reverseLedgerEntriesForOrderItemIds(
  tx: PrismaTx,
  orderItemIds: string[]
): Promise<number> {
  const uniqueIds = Array.from(new Set(orderItemIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return 0;
  }

  const result = await tx.vendorPayoutLedger.updateMany({
    where: {
      orderItemId: { in: uniqueIds },
      status: { not: "reversed" },
    },
    data: {
      status: "reversed",
      reversedAt: new Date(),
    },
  });

  return result.count;
}
