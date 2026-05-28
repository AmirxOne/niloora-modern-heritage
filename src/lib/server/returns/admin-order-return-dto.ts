import type { Prisma } from "@prisma/client";
import type { AdminOrderReturn, AdminOrderReturnDetail, AdminOrderReturnSummary } from "@/lib/types";

export const adminOrderReturnListSelect = {
  id: true,
  orderId: true,
  userId: true,
  reason: true,
  reasonDetail: true,
  status: true,
  refundableAmount: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      total: true,
      status: true,
      user: { select: { name: true, phone: true } },
    },
  },
  items: {
    select: {
      id: true,
      orderItemId: true,
      quantity: true,
      orderItem: {
        select: { id: true, name: true, price: true, quantity: true },
      },
    },
  },
  _count: { select: { statusHistory: true } },
} satisfies Prisma.OrderReturnSelect;

export const adminOrderReturnDetailSelect = {
  ...adminOrderReturnListSelect,
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      changedById: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderReturnSelect;

type ReturnListRow = Prisma.OrderReturnGetPayload<{
  select: typeof adminOrderReturnListSelect;
}>;

type ReturnDetailRow = Prisma.OrderReturnGetPayload<{
  select: typeof adminOrderReturnDetailSelect;
}>;

function mapReturnItems(row: ReturnListRow) {
  return row.items.map((item) => ({
    id: item.id,
    orderItemId: item.orderItemId,
    quantity: item.quantity,
    name: item.orderItem.name,
    unitPrice: item.orderItem.price,
    orderQuantity: item.orderItem.quantity,
    lineTotal: item.orderItem.price * item.quantity,
  }));
}

export function toAdminOrderReturnSummaryDto(row: ReturnListRow): AdminOrderReturnSummary {
  return {
    id: row.id,
    orderId: row.orderId,
    status: row.status as AdminOrderReturnSummary["status"],
    reason: row.reason,
    refundableAmount: row.refundableAmount,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminOrderReturnDto(row: ReturnListRow): AdminOrderReturn {
  return {
    ...toAdminOrderReturnSummaryDto(row),
    userId: row.userId,
    reasonDetail: row.reasonDetail,
    internalNotes: row.internalNotes,
    updatedAt: row.updatedAt.toISOString(),
    orderTotal: row.order.total,
    orderStatus: row.order.status,
    customer: {
      name: row.order.user.name,
      phone: row.order.user.phone,
    },
    items: mapReturnItems(row),
    historyCount: row._count.statusHistory,
  };
}

export function toAdminOrderReturnDetailDto(row: ReturnDetailRow): AdminOrderReturnDetail {
  return {
    ...toAdminOrderReturnDto(row),
    statusHistory: row.statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus as AdminOrderReturnDetail["status"],
      note: entry.note,
      changedById: entry.changedById,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
