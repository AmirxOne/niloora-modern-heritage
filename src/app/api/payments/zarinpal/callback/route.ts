import { NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { logPaymentEvent } from "@/lib/server/payment/log";
import { zarinpalVerifyPayment } from "@/lib/server/payment/zarinpal";
import { logRouteError } from "@/lib/server/route-errors";
import { notifyOrderPlaced } from "@/lib/server/notifications/order-notify";
import { prisma } from "@/lib/server/prisma";
import { rewardReferralOnPaidOrder } from "@/lib/server/referral/referral";
import { consumeGiftCardForOrder, createGiftCard } from "@/lib/server/gift-card/gift-card-service";
import { rewardLoyaltyOnPaidOrder } from "@/lib/server/loyalty/loyalty";
import { scheduleOrderMaintenanceReminders } from "@/lib/server/notifications/maintenance-reminders";
import { writeFunnelEvent } from "@/lib/server/analytics/funnel-log";

function redirect(path: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}${path}`);
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
    include: {
      order: {
        include: { items: true },
      },
    },
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

  const fail = async (reason: string, extra?: { code?: string; message?: string }) => {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          errorCode: extra?.code ?? reason,
          errorMessage: extra?.message ?? reason,
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
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

  if (payment.status === "paid") {
    const sessionToken = await createSession(payment.order.userId);
    await setSessionCookie(sessionToken);
    return redirect(`/cart?payment=success&orderId=${encodeURIComponent(payment.orderId)}`);
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
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "processing",
          loyaltyPointsEarned: payment.order.loyaltyPointsEarned ?? 0,
        },
      });
      if (payment.order.giftCardCode && (payment.order.giftCardAppliedAmount ?? 0) > 0) {
        await consumeGiftCardForOrder({
          code: payment.order.giftCardCode,
          orderId: payment.orderId,
          amount: payment.order.giftCardAppliedAmount ?? 0,
          tx,
        });
      }
      if (payment.order.orderType === "gift-card" && (payment.order.giftCardPurchaseAmount ?? 0) > 0) {
        await createGiftCard({
          amount: payment.order.giftCardPurchaseAmount ?? 0,
          purchaserUserId: payment.order.userId,
          orderId: payment.orderId,
          recipientName: payment.order.giftCardRecipientName ?? null,
          recipientContact: payment.order.giftCardRecipientContact ?? null,
          note: "Gift card purchased online",
          tx,
        });
      }
      await rewardReferralOnPaidOrder(tx, payment.orderId);
      await rewardLoyaltyOnPaidOrder(tx, payment.orderId);
      await scheduleOrderMaintenanceReminders(tx, payment.orderId);
    });

    await logPaymentEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      level: "info",
      event: "payment.verified",
      message: verified.message,
      meta: { refId: verified.refId, code: verified.code },
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

    const sessionToken = await createSession(payment.order.userId);
    await setSessionCookie(sessionToken);

    return redirect(`/cart?payment=success&orderId=${encodeURIComponent(payment.orderId)}`);
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
