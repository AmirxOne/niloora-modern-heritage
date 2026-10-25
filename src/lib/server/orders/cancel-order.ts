import { prisma } from "@/lib/server/prisma";
import { serverLogger } from "@/lib/observability/logger";

/**
 * CUSTOMER CANCELLATION + STOCK RESTOCK
 *
 * Rules:
 * - A customer may cancel while the order is still in "processing"
 *   (i.e. paid but not yet crafting/shipped/delivered).
 * - Unpaid orders (pending_payment / payment_failed) can be discarded too.
 * - On cancellation of a PAID order, the payment is marked refund_pending —
 *   the actual gateway refund is a manual admin step (Zarinpal reverse),
 *   recorded by the admin when done.
 * - Catalog stock that was deducted at finalize is restocked (best-effort,
 *   logged) and sold-out products become available again.
 */

export const CUSTOMER_CANCELLABLE_STATUSES = [
  "pending_payment",
  "payment_failed",
  "processing",
] as const;

export type CustomerCancellableStatus = (typeof CUSTOMER_CANCELLABLE_STATUSES)[number];

export type CancelOrderResult =
  | { ok: true; status: "cancelled"; refunded: "none" | "refund_pending" }
  | { ok: false; reason: "not_found" | "not_cancellable" | "already_cancelled" };

export async function isOrderCancellableByCustomer(
  status: string
): Promise<boolean> {
  return (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

/** Restock deducted quantities for an order's catalog lines (idempotent). */
export async function restockOrderItems(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const totals = new Map<string, number>();
  for (const item of order.items) {
    if (!item.productId || item.quantity <= 0) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }

  for (const entry of Array.from(totals)) {
    const productId = entry[0];
    const quantity = entry[1];
    await prisma.product.updateMany({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
    // a sold-out product is purchasable again after restock
    await prisma.product.updateMany({
      where: { id: productId, stock: { gt: 0 }, availability: "sold" },
      data: { availability: "ready" },
    });
  }
}

export async function cancelOrderByCustomer(orderId: string, userId: string): Promise<CancelOrderResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });
  if (!order) return { ok: false, reason: "not_found" };

  if (order.status === "cancelled") {
    return { ok: false, reason: "already_cancelled" };
  }
  if (!isOrderCancellableByCustomer(order.status)) {
    return { ok: false, reason: "not_cancellable" };
  }

  const wasPaid = order.payment?.status === "paid";

  await prisma.$transaction(async (tx) => {
    // conditional guard against double-cancel races
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "cancelled" },
    });
    if (claimed.count === 0) return;

    if (wasPaid) {
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "paid" },
        data: {
          status: "refund_pending",
          errorMessage: "لغو توسط مشتری — در انتظار بازگشت وجه",
        },
      });
    }
  });

  // restock outside the tx (best-effort; log on failure)
  try {
    await restockOrderItems(order.id);
  } catch (error) {
    serverLogger.error("restock after cancellation failed", { orderId: order.id }, error);
  }

  serverLogger.info("order cancelled by customer", {
    orderId: order.id,
    userId,
    wasPaid,
  });

  return {
    ok: true,
    status: "cancelled",
    refunded: wasPaid ? "refund_pending" : "none",
  };
}
