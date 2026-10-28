import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { logPaymentEvent } from "@/lib/server/payment/log";
import { zarinpalVerifyPayment } from "@/lib/server/payment/zarinpal";
import { logRouteError } from "@/lib/server/route-errors";
import { notifyOrderPlaced } from "@/lib/server/notifications/order-notify";
import { maybeCreatePostCheckoutSession } from "@/lib/server/auth/post-checkout-session";
import {
  claimVerifiedPayment,
  deductStockForOrder,
} from "@/lib/server/orders/finalize-order";
import { creditSellersForOrder } from "@/lib/server/sellers/seller-service";
import { prisma } from "@/lib/server/prisma";

function redirect(path: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}${path}`);
}

function successRedirect(orderId: string) {
  return redirect(`/cart?payment=success&orderId=${encodeURIComponent(orderId)}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority")?.trim() ?? "";
  const statusParam = url.searchParams.get("Status")?.trim() ?? "";

  if (!authority) {
    return redirect("/cart?payment=failed&reason=missing_authority");
  }

  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: { order: { include: { items: true } } },
  });

  if (!payment) {
    await logPaymentEvent({
      level: "error",
      event: "callback.payment_not_found",
      message: "Unknown authority",
      meta: { authority },
    });
    return redirect("/cart?payment=failed&reason=unknown_payment");
  }

  // GUARD: a payment already marked paid stays paid regardless of the
  // (user-controlled, unreliable) Status param — a retried/refreshed callback
  // with Status=NOK must NOT flip a settled payment to failed.
  if (payment.status === "paid") {
    await maybeCreatePostCheckoutSession(payment.order.userId);
    return successRedirect(payment.orderId);
  }

  const fail = async (reason: string, extra?: { code?: string; message?: string }) => {
    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { id: payment.id, status: "pending" },
        data: {
          status: "failed",
          errorCode: extra?.code ?? reason,
          errorMessage: extra?.message ?? reason,
        },
      }),
      prisma.order.updateMany({
        where: { id: payment.orderId, status: "pending_payment" },
        data: { status: "payment_failed" },
      }),
    ]);

    await logPaymentEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      level: "error",
      event: "payment.failed",
      message: extra?.message ?? reason,
      meta: { authority, statusParam, ...extra },
    });

    return redirect(
      `/cart?payment=failed&orderId=${encodeURIComponent(payment.orderId)}&reason=${encodeURIComponent(reason)}`
    );
  };

  if (statusParam !== "OK") {
    return fail("user_cancelled", { message: "کاربر پرداخت را لغو کرد" });
  }

  try {
    const verified = await zarinpalVerifyPayment({
      authority,
      amountRial: payment.amountRial,
    });

    if (!verified.ok) {
      return fail("verify_rejected", {
        code: String(verified.code),
        message: verified.message,
      });
    }

    // ATOMIC CLAIM: pending→paid + order→processing, exactly once.
    // Concurrent/duplicate callbacks that lose the race no-op here.
    const claimed = await claimVerifiedPayment(payment.id, {
      refId: verified.refId,
      cardPan: verified.cardPan,
      fee: verified.fee,
    });
    if (claimed.ok && !claimed.alreadyFinalized) {
      // Stock deduction runs only for the claim winner — once per order.
      const stock = await deductStockForOrder(payment.orderId);
      if (!stock.ok) {
        // Money was taken but stock ran out in between: log for manual
        // handling (refund/replenish). Payment/order stay settled.
        await logPaymentEvent({
          paymentId: payment.id,
          orderId: payment.orderId,
          level: "error",
          event: "payment.stock_conflict",
          message: "پرداخت موفق اما موجودی کافی نیست — نیاز به رسیدگی دستی",
          meta: { authority, productId: stock.productId },
        });
      }

      // Marketplace: credit each seller's share (idempotent per order)
      try {
        await creditSellersForOrder(payment.orderId);
      } catch (error) {
        logRouteError(error, {
          route: "/api/payments/zarinpal/callback",
          context: { orderId: payment.orderId, step: "seller_credit" },
        });
      }

      await logPaymentEvent({
        paymentId: payment.id,
        orderId: payment.orderId,
        level: "info",
        event: "payment.verified",
        message: verified.message,
        meta: { refId: verified.refId, code: verified.code },
      });

      await notifyOrderPlaced(payment.orderId);
    }

    // SECURITY: only guest/OTP-only accounts (no usable password) may be
    // auto-logged-in here; real account holders must sign in via OTP.
    await maybeCreatePostCheckoutSession(payment.order.userId);

    return successRedirect(payment.orderId);
  } catch (error) {
    logRouteError(error, {
      route: "/api/payments/zarinpal/callback",
      context: { orderId: payment.orderId, authority },
    });
    const message = error instanceof Error ? error.message : "Verify failed";
    await logPaymentEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      level: "error",
      event: "zarinpal.verify.error",
      message,
      meta: { authority },
    });
    return fail("verify_error", { message });
  }
}
