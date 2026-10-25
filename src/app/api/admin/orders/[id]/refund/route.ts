import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";

/**
 * Admin records that a pending refund (customer-cancelled paid order) has
 * actually been returned via the gateway panel (Zarinpal reverse). The
 * gateway API reverse call is executed manually by the gallery; this endpoint
 * only settles the internal ledger: payment refund_pending → refunded.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params; // order id

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!order) return notFound("سفارش یافت نشد.");
    if (order.status !== "cancelled") {
      return badRequest("فقط سفارش‌های لغو‌شده قابل تسویه هستند.");
    }
    if (!order.payment || order.payment.status !== "refund_pending") {
      return badRequest("پرداخت این سفارش در انتظار بازگشت وجه نیست.");
    }

    const updated = await prisma.payment.updateMany({
      where: { orderId: order.id, status: "refund_pending" },
      data: {
        status: "refunded",
        errorMessage: null,
        // keep the original note out of errorMessage; settlement is final
      },
    });
    if (updated.count === 0) {
      return badRequest("این بازگشت وجه قبلاً ثبت شده است.");
    }

    serverLogger.info("refund settled by admin", {
      orderId: order.id,
      adminId: user!.id,
      refId: order.payment.refId,
    });

    return ok({ orderId: order.id, paymentStatus: "refunded" });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/[id]/refund" });
  }
}
