import type { Prisma } from "@prisma/client";
import { resolveUnifiedReturnStatus } from "@/lib/returns/workflow";
import type { CustomerOrderReturn, OrderReturnStatus } from "@/lib/types";

export const customerOrderReturnSelect = {
  id: true,
  orderId: true,
  reason: true,
  reasonDetail: true,
  status: true,
  refundableAmount: true,
  createdAt: true,
  supportRequestId: true,
  items: {
    select: {
      orderItemId: true,
      quantity: true,
      orderItem: { select: { name: true } },
    },
  },
} satisfies Prisma.OrderReturnSelect;

type CustomerReturnRow = Prisma.OrderReturnGetPayload<{
  select: typeof customerOrderReturnSelect;
}>;

export function toCustomerOrderReturnDto(row: CustomerReturnRow): CustomerOrderReturn {
  return {
    id: row.id,
    orderId: row.orderId,
    supportRequestId: row.supportRequestId ?? undefined,
    status: row.status as OrderReturnStatus,
    unifiedStatus: resolveUnifiedReturnStatus({ returnStatus: row.status as OrderReturnStatus }),
    reason: row.reason,
    reasonDetail: row.reasonDetail,
    refundableAmount: row.refundableAmount,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      name: item.orderItem.name,
    })),
  };
}
