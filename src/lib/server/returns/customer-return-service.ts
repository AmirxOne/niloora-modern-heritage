import { prisma } from "@/lib/server/prisma";
import {
  OPEN_ORDER_RETURN_STATUSES,
  RETURN_ELIGIBLE_ORDER_STATUSES,
} from "@/lib/returns/workflow";
import {
  isOrderReturnReason,
  ORDER_RETURN_REASON_DETAIL_MAX,
} from "@/lib/server/returns/order-return";
import {
  customerOrderReturnSelect,
  toCustomerOrderReturnDto,
} from "@/lib/server/returns/customer-order-return-dto";
import { validateReturnItems, type ReturnItemInput } from "@/lib/server/returns/order-return-service";
import { normalizePhone } from "@/lib/server/support-request/support-request";
import { formatTomanAmount } from "@/lib/utils";

function normalizeReasonDetail(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.length > ORDER_RETURN_REASON_DETAIL_MAX) {
    throw new Error("توضیح دلیل مرجوعی بیش از حد مجاز است.");
  }
  return trimmed;
}

function buildSupportMessage(input: {
  items: Array<{ name: string; quantity: number }>;
  reason: string;
  reasonDetail?: string | null;
  refundableAmount: number;
  extraMessage?: string | null;
}): string {
  const lines = [
    "درخواست مرجوعی ساختاریافته از حساب کاربری",
    "",
    "اقلام انتخاب‌شده:",
    ...input.items.map((item) => `- ${item.name} × ${item.quantity.toLocaleString("fa-IR")}`),
    "",
    `دلیل: ${input.reason}`,
  ];
  if (input.reasonDetail) lines.push(`توضیح: ${input.reasonDetail}`);
  lines.push(`مبلغ پیشنهادی بازگشت: ${formatTomanAmount(input.refundableAmount)} تومان`);
  if (input.extraMessage?.trim()) {
    lines.push("", "توضیح تکمیلی مشتری:", input.extraMessage.trim());
  }
  return lines.join("\n");
}

function suggestRefundableAmount(
  orderItems: Array<{ id: string; price: number; quantity: number }>,
  selected: ReturnItemInput[]
): number {
  const byId = new Map(orderItems.map((item) => [item.id, item]));
  return selected.reduce((sum, selectedItem) => {
    const line = byId.get(selectedItem.orderItemId);
    if (!line) return sum;
    return sum + line.price * selectedItem.quantity;
  }, 0);
}

export async function listCustomerOrderReturns(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true },
  });
  if (!order) throw new Error("سفارش یافت نشد.");

  const rows = await prisma.orderReturn.findMany({
    where: { orderId, userId },
    select: customerOrderReturnSelect,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toCustomerOrderReturnDto);
}

export async function createCustomerReturnRequest(input: {
  userId: string;
  orderId: string;
  reason: string;
  reasonDetail?: string | null;
  refundableAmount?: number;
  items: ReturnItemInput[];
  extraMessage?: string | null;
  profile: { name: string; phone: string; email?: string | null };
}) {
  if (!isOrderReturnReason(input.reason)) {
    throw new Error("دلیل مرجوعی نامعتبر است.");
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
    select: {
      id: true,
      userId: true,
      total: true,
      status: true,
      items: { select: { id: true, name: true, price: true, quantity: true } },
    },
  });
  if (!order) throw new Error("سفارش یافت نشد.");
  if (!(RETURN_ELIGIBLE_ORDER_STATUSES as readonly string[]).includes(order.status)) {
    throw new Error("این سفارش در وضعیت فعلی قابل مرجوعی نیست.");
  }

  const openReturn = await prisma.orderReturn.findFirst({
    where: {
      orderId: order.id,
      status: { in: OPEN_ORDER_RETURN_STATUSES },
    },
    select: { id: true },
  });
  if (openReturn) {
    throw new Error("یک درخواست مرجوعی باز برای این سفارش وجود دارد.");
  }

  const reasonDetail = normalizeReasonDetail(input.reasonDetail);
  const suggested = suggestRefundableAmount(order.items, input.items);
  const refundableAmount =
    input.refundableAmount !== undefined
      ? Math.max(0, Math.round(input.refundableAmount))
      : suggested;

  if (refundableAmount > order.total) {
    throw new Error("مبلغ قابل بازگشت از مبلغ سفارش بیشتر است.");
  }

  const itemNames = input.items.map((selected) => {
    const line = order.items.find((item) => item.id === selected.orderItemId);
    return { name: line?.name ?? selected.orderItemId, quantity: selected.quantity };
  });

  const message = buildSupportMessage({
    items: itemNames,
    reason: input.reason,
    reasonDetail,
    refundableAmount,
    extraMessage: input.extraMessage,
  });

  return prisma.$transaction(async (tx) => {
    await validateReturnItems(order.id, input.items, tx);

    const supportRequest = await tx.supportRequest.create({
      data: {
        userId: input.userId,
        orderId: order.id,
        kind: "return",
        category: input.reason,
        fullName: input.profile.name.trim(),
        phone: normalizePhone(input.profile.phone),
        email: input.profile.email?.trim() || null,
        message,
        status: "pending",
      },
    });

    const created = await tx.orderReturn.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        supportRequestId: supportRequest.id,
        reason: input.reason,
        reasonDetail,
        status: "requested",
        refundableAmount,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "requested",
            note: "ثبت درخواست مرجوعی توسط مشتری",
            changedById: input.userId,
          },
        },
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      select: customerOrderReturnSelect,
    });

    return {
      return: toCustomerOrderReturnDto(created),
      supportRequestId: supportRequest.id,
    };
  });
}
