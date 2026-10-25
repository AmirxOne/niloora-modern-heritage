import { prisma } from "@/lib/server/prisma";

/**
 * FINALIZE INVARIANT:
 * A verified payment must flip pending→paid and the order to processing
 * exactly ONCE (conditional claim — concurrent callbacks no-op), and stock is
 * deducted once, after the claim, with a conditional decrement that cannot go
 * negative. If stock ran out between checkout and payment, the payment stays
 * paid (money was taken) and the conflict is logged for manual handling.
 */

export type VerifiedPaymentMeta = {
  refId?: string;
  cardPan?: string;
  fee?: number;
};

export type FinalizeResult =
  | { ok: true; alreadyFinalized: boolean }
  | { ok: false; reason: "payment_not_found" };

export class StockConflictError extends Error {
  readonly productId: string;

  constructor(productId: string) {
    super(`insufficient_stock:${productId}`);
    this.name = "StockConflictError";
    this.productId = productId;
  }
}

/**
 * Step 1 — claim the payment (pending→paid) and mark the order processing.
 * Conditional on status:"pending" so a duplicate/re-entrant callback cannot
 * double-apply or overwrite a previously recorded failure.
 */
export async function claimVerifiedPayment(
  paymentId: string,
  meta: VerifiedPaymentMeta
): Promise<FinalizeResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, orderId: true, status: true },
  });
  if (!payment) return { ok: false, reason: "payment_not_found" };

  if (payment.status !== "pending") {
    return { ok: true, alreadyFinalized: true };
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: "pending" },
    data: {
      status: "paid",
      refId: meta.refId ?? null,
      cardPan: meta.cardPan ?? null,
      fee: meta.fee ?? null,
      verifiedAt: new Date(),
      errorCode: null,
      errorMessage: null,
    },
  });
  if (claimed.count === 0) {
    return { ok: true, alreadyFinalized: true };
  }

  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: "processing" },
  });

  return { ok: true, alreadyFinalized: false };
}

/**
 * Step 2 — deduct stock for the order's catalog lines (customizer lines have
 * no productId). Runs only for the request that won the claim, so the
 * deduction happens exactly once per order. Conditional decrement guarantees
 * no negative stock; sold-out products flip availability to "sold".
 */
export async function deductStockForOrder(
  orderId: string
): Promise<{ ok: true } | { ok: false; productId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, productId: "" };

  const totals = new Map<string, number>();
  for (const item of order.items) {
    if (!item.productId || item.quantity <= 0) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }

  for (const [productId, quantity] of Array.from(totals)) {
    const updated = await prisma.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      return { ok: false, productId };
    }
    await prisma.product.updateMany({
      where: { id: productId, stock: { lte: 0 }, availability: { not: "sold" } },
      data: { availability: "sold" },
    });
  }

  return { ok: true };
}
