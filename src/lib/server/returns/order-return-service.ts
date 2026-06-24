import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  isOrderReturnReason,
  isOrderReturnStatus,
  ORDER_RETURN_INTERNAL_NOTES_MAX,
  ORDER_RETURN_REASON_DETAIL_MAX,
  ORDER_RETURN_STATUS_NOTE_MAX,
  type OrderReturnStatus,
} from "@/lib/server/returns/order-return";
import {
  adminOrderReturnDetailSelect,
  toAdminOrderReturnDetailDto,
} from "@/lib/server/returns/admin-order-return-dto";
import { syncSupportRequestFromReturnStatus } from "@/lib/server/returns/return-status-sync";
import { restockInventoryForApprovedReturn } from "@/lib/server/inventory/restock-return-inventory";

import type { OrderReturnItemInput } from "@/lib/types";

export type ReturnItemInput = OrderReturnItemInput;

export type UpdateOrderReturnInput = {
  status?: OrderReturnStatus;
  statusNote?: string | null;
  internalNotes?: string | null;
  refundableAmount?: number;
  reason?: string;
  reasonDetail?: string | null;
  items?: ReturnItemInput[];
  changedById?: string | null;
};

function normalizeInternalNotes(raw: string | null | undefined): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const trimmed = raw.trim();
  if (trimmed.length > ORDER_RETURN_INTERNAL_NOTES_MAX) {
    throw new Error(
      `یادداشت داخلی حداکثر ${ORDER_RETURN_INTERNAL_NOTES_MAX.toLocaleString("fa-IR")} کاراکتر است.`
    );
  }
  return trimmed;
}

function normalizeReasonDetail(raw: string | null | undefined): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const trimmed = raw.trim();
  if (trimmed.length > ORDER_RETURN_REASON_DETAIL_MAX) {
    throw new Error("توضیح دلیل مرجوعی بیش از حد مجاز است.");
  }
  return trimmed;
}

function normalizeStatusNote(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.length > ORDER_RETURN_STATUS_NOTE_MAX) {
    throw new Error("یادداشت تغییر وضعیت بیش از حد مجاز است.");
  }
  return trimmed;
}

export async function validateReturnItems(
  orderId: string,
  items: ReturnItemInput[],
  tx: Prisma.TransactionClient
) {
  if (items.length === 0) {
    throw new Error("حداقل یک قلم سفارش برای مرجوعی انتخاب کنید.");
  }

  const orderItems = await tx.orderItem.findMany({
    where: { orderId },
    select: { id: true, quantity: true },
  });
  const byId = new Map(orderItems.map((item) => [item.id, item.quantity]));

  for (const item of items) {
    const maxQty = byId.get(item.orderItemId);
    if (maxQty === undefined) {
      throw new Error("قلم سفارش نامعتبر است.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maxQty) {
      throw new Error(`تعداد مرجوعی برای قلم ${item.orderItemId} نامعتبر است.`);
    }
  }
}

export async function createOrderReturn(input: {
  orderId: string;
  reason: string;
  reasonDetail?: string | null;
  refundableAmount?: number;
  items: ReturnItemInput[];
  changedById?: string | null;
  supportRequestId?: string | null;
}) {
  if (!isOrderReturnReason(input.reason)) {
    throw new Error("دلیل مرجوعی نامعتبر است.");
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, userId: true, total: true },
  });
  if (!order) throw new Error("سفارش یافت نشد.");

  const refundableAmount =
    input.refundableAmount !== undefined
      ? Math.max(0, Math.round(input.refundableAmount))
      : 0;
  if (refundableAmount > order.total) {
    throw new Error("مبلغ قابل بازگشت از مبلغ سفارش بیشتر است.");
  }

  const reasonDetail = normalizeReasonDetail(input.reasonDetail ?? null);

  return prisma.$transaction(async (tx) => {
    await validateReturnItems(order.id, input.items, tx);

    const created = await tx.orderReturn.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        supportRequestId: input.supportRequestId ?? null,
        reason: input.reason,
        reasonDetail: reasonDetail ?? null,
        status: "requested",
        refundableAmount,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "requested",
            note: "ثبت درخواست مرجوعی",
            changedById: input.changedById ?? null,
          },
        },
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      select: adminOrderReturnDetailSelect,
    });

    return toAdminOrderReturnDetailDto(created);
  });
}

export async function updateOrderReturn(returnId: string, input: UpdateOrderReturnInput) {
  const existing = await prisma.orderReturn.findUnique({
    where: { id: returnId },
    select: { id: true, status: true, orderId: true, supportRequestId: true },
  });
  if (!existing) throw new Error("درخواست مرجوعی یافت نشد.");

  if (input.status !== undefined && !isOrderReturnStatus(input.status)) {
    throw new Error("وضعیت مرجوعی نامعتبر است.");
  }
  if (input.reason !== undefined && !isOrderReturnReason(input.reason)) {
    throw new Error("دلیل مرجوعی نامعتبر است.");
  }

  const internalNotes = normalizeInternalNotes(input.internalNotes);
  const reasonDetail = normalizeReasonDetail(input.reasonDetail);
  const statusNote = input.statusNote !== undefined ? normalizeStatusNote(input.statusNote) : null;

  if (input.refundableAmount !== undefined) {
    const order = await prisma.order.findUnique({
      where: { id: existing.orderId },
      select: { total: true },
    });
    if (!order) throw new Error("سفارش یافت نشد.");
    if (input.refundableAmount < 0 || input.refundableAmount > order.total) {
      throw new Error("مبلغ قابل بازگشت نامعتبر است.");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (input.items) {
      await validateReturnItems(existing.orderId, input.items, tx);
      await tx.orderReturnItem.deleteMany({ where: { returnId } });
      await tx.orderReturnItem.createMany({
        data: input.items.map((item) => ({
          returnId,
          orderItemId: item.orderItemId,
          quantity: item.quantity,
        })),
      });
    }

    const nextStatus = (input.status ?? existing.status) as OrderReturnStatus;
    const statusChanged = input.status !== undefined && input.status !== existing.status;

    await tx.orderReturn.update({
      where: { id: returnId },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(reasonDetail !== undefined ? { reasonDetail } : {}),
        ...(internalNotes !== undefined ? { internalNotes } : {}),
        ...(input.refundableAmount !== undefined
          ? { refundableAmount: Math.round(input.refundableAmount) }
          : {}),
      },
    });

    if (statusChanged) {
      await tx.orderReturnStatusHistory.create({
        data: {
          returnId,
          fromStatus: existing.status,
          toStatus: nextStatus,
          note: statusNote,
          changedById: input.changedById ?? null,
        },
      });
      if (existing.supportRequestId) {
        await syncSupportRequestFromReturnStatus(tx, existing.supportRequestId, nextStatus);
      }
      if (nextStatus === "approved") {
        await restockInventoryForApprovedReturn(tx, returnId);
      }
    }

    const updated = await tx.orderReturn.findUniqueOrThrow({
      where: { id: returnId },
      select: adminOrderReturnDetailSelect,
    });

    return toAdminOrderReturnDetailDto(updated);
  });
}

export async function loadOrderReturnSummariesByOrderIds(
  orderIds: string[]
): Promise<Map<string, import("@/lib/types").AdminOrderReturnSummary[]>> {
  if (orderIds.length === 0) return new Map();

  const rows = await prisma.orderReturn.findMany({
    where: { orderId: { in: orderIds } },
    select: {
      id: true,
      orderId: true,
      status: true,
      reason: true,
      refundableAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, import("@/lib/types").AdminOrderReturnSummary[]>();
  for (const row of rows) {
    const summary = {
      id: row.id,
      orderId: row.orderId,
      status: row.status as import("@/lib/types").AdminOrderReturnSummary["status"],
      reason: row.reason,
      refundableAmount: row.refundableAmount,
      createdAt: row.createdAt.toISOString(),
    };
    const list = map.get(row.orderId) ?? [];
    list.push(summary);
    map.set(row.orderId, list);
  }
  return map;
}
