import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverLogger } from "@/lib/observability/logger";
import { zarinpalReversePayment } from "@/lib/server/payment/zarinpal";
import { logPaymentEvent } from "@/lib/server/payment/log";
import { prisma } from "@/lib/server/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Settle a pending refund for a customer-cancelled paid order.
 *
 * Flow: if the gateway is configured and the payment has an authority, we
 * FIRST reverse the money via Zarinpal refund.json, and only on gateway
 * success (or already-reversed) mark the internal payment refunded.
 * If the payment has no gateway authority (local/test payment row), the
 * refund is recorded manually — the admin confirms the money was returned.
 */
export async function POST(_request: Request, context: RouteContext) {
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

    const payment = order.payment;

    if (payment.authority) {
      // gateway-backed payment — reverse the money FIRST
      try {
        const reversed = await zarinpalReversePayment({
          authority: payment.authority,
          amountRial: payment.amountRial,
        });

        if (!reversed.ok) {
          await logPaymentEvent({
            paymentId: payment.id,
            orderId: order.id,
            level: "error",
            event: "zarinpal.refund.rejected",
            message: reversed.message,
            meta: { code: reversed.code, authority: payment.authority },
          });
          return badRequest(
            "درگاه، بازگشت وجه را تأیید نکرد. مبلغ را از پنل زرین‌پال بررسی کنید و دوباره تلاش کنید."
          );
        }

        const updated = await prisma.payment.updateMany({
          where: { orderId: order.id, status: "refund_pending" },
          data: {
            status: "refunded",
            errorMessage: reversed.refundId ? `refund:${reversed.refundId}` : null,
          },
        });
        if (updated.count === 0) {
          return badRequest("این بازگشت وجه قبلاً ثبت شده است.");
        }

        await logPaymentEvent({
          paymentId: payment.id,
          orderId: order.id,
          level: "info",
          event: "payment.refunded",
          message: "بازگشت وجه خودکار از درگاه انجام شد",
          meta: { refundId: reversed.refundId, code: reversed.code },
        });
        serverLogger.info("refund settled via gateway", {
          orderId: order.id,
          adminId: user!.id,
        });

        return ok({ orderId: order.id, paymentStatus: "refunded", mode: "gateway" });
      } catch (error) {
        logPaymentEvent({
          paymentId: payment.id,
          orderId: order.id,
          level: "error",
          event: "zarinpal.refund.error",
          message: error instanceof Error ? error.message : "refund failed",
          meta: { authority: payment.authority },
        });
        // gateway call itself failed — never silently mark refunded
        return badRequest(
          "ارتباط با درگاه برای بازگشت وجه برقرار نشد. پس از لحظاتی دوباره تلاش کنید."
        );
      }
    }

    // No gateway authority (test/local payment row): manual settlement.
    const updated = await prisma.payment.updateMany({
      where: { orderId: order.id, status: "refund_pending" },
      data: { status: "refunded", errorMessage: null },
    });
    if (updated.count === 0) {
      return badRequest("این بازگشت وجه قبلاً ثبت شده است.");
    }

    serverLogger.info("refund settled manually by admin", {
      orderId: order.id,
      adminId: user!.id,
    });

    return ok({ orderId: order.id, paymentStatus: "refunded", mode: "manual" });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/orders/[id]/refund" });
  }
}
