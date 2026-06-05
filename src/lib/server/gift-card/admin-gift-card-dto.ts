import type { Prisma } from "@prisma/client";
import type { AdminGiftCardRecord } from "@/lib/types";

export const adminGiftCardListInclude = {
  purchaser: { select: { id: true, phone: true } },
  order: { select: { id: true } },
  transactions: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
} satisfies Prisma.GiftCardInclude;

type AdminGiftCardRow = Prisma.GiftCardGetPayload<{
  include: typeof adminGiftCardListInclude;
}>;

export function toAdminGiftCardDto(row: AdminGiftCardRow): AdminGiftCardRecord {
  return {
    id: row.id,
    code: row.code,
    initialAmount: row.initialAmount,
    remainingAmount: row.remainingAmount,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    note: row.note ?? "",
    recipientName: row.recipientName ?? "",
    recipientContact: row.recipientContact ?? "",
    purchaserUserId: row.purchaserUserId ?? "",
    purchaserPhone: row.purchaser?.phone ?? "",
    orderId: row.orderId ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    transactions: row.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description ?? "",
      orderId: transaction.orderId ?? "",
      createdAt: transaction.createdAt.toISOString(),
    })),
  };
}
