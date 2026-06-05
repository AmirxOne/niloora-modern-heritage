export { dynamic } from "@/lib/server/route-segment";

import { NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { logPaymentEvent } from "@/lib/server/payment/log";
import { zarinpalVerifyPayment } from "@/lib/server/payment/zarinpal";
import { logRouteError } from "@/lib/server/route-errors";
import { notifyOrderPlaced } from "@/lib/server/notifications/order-notify";
import { prisma } from "@/lib/server/prisma";
import { releaseGiftCardReservation } from "@/lib/server/gift-card/gift-card-service";
import { writeFunnelEvent } from "@/lib/server/analytics/funnel-log";
import { finalizePaidOrder } from "@/lib/server/orders/finalize-paid-order";

type CallbackPayment = {
  id: string;
  orderId: string;
  amountRial: number;
  status: string;
  order: {
    id: string;
    userId: string;
    orderType: string;
    total: number;
    items: Array<{
      id: string;
      productId: string | null;
      name: string;
      price: number;
      quantity: number;
    }>;
  };
};

function redirect(path: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}${path}`);
}

function paymentReturnPath(
  order: { id: string; orderType: string },
  status: "success" | "failed",
  reason?: string
): string {
  const basePath = order.orderType === "gift-card" ? "/gift-cards" : "/cart";
  let path = `${basePath}?payment=${status}&orderId=${encodeURIComponent(order.id)}`;
  if (status === "failed" && reason) {
    path += `&reason=${encodeURIComponent(reason)}`;
  }
  return path;
}

async function completeSuccessfulReturn(payment: CallbackPayment, request: Request) {
  try {
    await logPaymentEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      level: "info",
      event: "payment.verified",
      message: "Payment callback completed",
      meta: { orderId: payment.orderId },
    });
    notifyOrderPlaced(payment.orderId);
    await writeFunnelEvent(
      {
        event_name: "purchase",
        event_id: `server-purchase-${payment.orderId}`,
        client_id: `server-${payment.order.userId}`,
        session_id: `server-${payment.id}`,
        page_location: "/api/payments/zarinpal/callback",
        occurred_at: new Date().toISOString(),
        user_id: payment.order.userId,
        transaction_id: payment.orderId,
        payment_method: "zarinpal",
        currency: "IRR",
        value: payment.order.total,
        funnel_step: "purchase",
        items: payment.order.items.map((item) => ({
          item_id: item.productId ?? item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        metadata: { source: "zarinpal_callback" },
      },
      request
    );
  } catch (error) {
    logRouteError(error, {
      route: "/api/payments/zarinpal/callback",
      context: { phase: "post_payment_side_effects", orderId: payment.orderId },
    });
  }

  try {
    const sessionToken = await createSession(payment.order.userId);
    await setSessionCookie(sessionToken);
  } catch (error) {
    logRouteError(error, {
      route: "/api/payments/zarinpal/callback",
      context: { phase: "session_restore", orderId: payment.orderId },
    });
  }

  return redirect(paymentReturnPath(payment.order, "success"));
}

async function loadPaymentByAuthority(authority: string) {
  return prisma.payment.findUnique({
    where: { authority },
    include: {
      order: {
        include: { items: true },
      },
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = url.searchParams.get("Authority")?.trim() ?? "";
  const statusParam = url.searchParams.get("Status")?.trim() ?? "";

  try {
    if (!authority) {
      return redirect("/cart?payment=failed&reason=missing_authority");
    }

    const payment = await loadPaymentByAuthority(authority);

    if (!payment) {
      try {
        await logPaymentEvent({
          level: "error",
          event: "callback.payment_not_found",
          message: "Unknown authority",
          meta: { authority },
        });
      } catch (error) {
        logRouteError(error, {
          route: "/api/payments/zarinpal/callback",
          context: { phase: "unknown_payment_log", authority },
        });
      }
      return redirect("/cart?payment=failed&reason=unknown_payment");
    }

    const fail = async (reason: string, extra?: { code?: string; message?: string }) => {
      try {
        await prisma.$transaction(async (tx) => {
          await releaseGiftCardReservation({ orderId: payment.orderId, tx });
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "failed",
              errorCode: extra?.code ?? reason,
              errorMessage: extra?.message ?? reason,
            },
          });
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "payment_failed" },
          });
        });
        await logPaymentEvent({
          paymentId: payment.id,
          orderId: payment.orderId,
          level: "error",
          event: "payment.failed",
          message: extra?.message ?? reason,
          meta: { authority, statusParam, ...extra },
        });
      } catch (error) {
        logRouteError(error, {
          route: "/api/payments/zarinpal/callback",
          context: { phase: "fail_path", orderId: payment.orderId, reason },
        });
      }

      return redirect(paymentReturnPath(payment.order, "failed", reason));
    };

    if (statusParam !== "OK") {
      return fail("user_cancelled", { message: "کاربر پرداخت را لغو کرد" });
    }

    if (payment.status === "paid") {
      return completeSuccessfulReturn(payment, request);
    }

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

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          refId: verified.refId ?? null,
          cardPan: verified.cardPan ?? null,
          fee: verified.fee ?? null,
          verifiedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });
      await finalizePaidOrder(tx, payment.order);
    });

    const settledPayment = (await loadPaymentByAuthority(authority)) ?? {
      ...payment,
      status: "paid",
    };

    return completeSuccessfulReturn(settledPayment, request);
  } catch (error) {
    logRouteError(error, {
      route: "/api/payments/zarinpal/callback",
      context: { authority, statusParam },
    });

    if (authority) {
      try {
        const payment = await loadPaymentByAuthority(authority);
        if (payment?.status === "paid") {
          return completeSuccessfulReturn(payment, request);
        }
        if (payment) {
          return redirect(paymentReturnPath(payment.order, "failed", "callback_error"));
        }
      } catch (recoveryError) {
        logRouteError(recoveryError, {
          route: "/api/payments/zarinpal/callback",
          context: { phase: "recovery", authority },
        });
      }
    }

    return redirect("/cart?payment=failed&reason=callback_error");
  }
}
