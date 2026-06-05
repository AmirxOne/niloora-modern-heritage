export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { createOrderId } from "@/lib/server/orders/create-order";
import { logPaymentEvent } from "@/lib/server/payment/log";
import { isZarinpalConfigured, tomanToRial, zarinpalRequestPayment } from "@/lib/server/payment/zarinpal";
import { prisma } from "@/lib/server/prisma";
import { clampGiftCardPurchaseAmount } from "@/lib/server/gift-card/gift-card";

type Body = {
  amount?: number;
  recipientName?: string;
  recipientContact?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return badRequest("برای خرید کارت هدیه ابتدا وارد شوید.");
    if (!(await isZarinpalConfigured())) return badRequest("درگاه پرداخت پیکربندی نشده است.");

    const payload = (await request.json()) as Body;
    const amount = clampGiftCardPurchaseAmount(Number(payload.amount ?? 0));
    if (!amount) return badRequest("مبلغ کارت هدیه نامعتبر است.");

    const orderId = createOrderId();
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        orderType: "gift-card",
        status: "pending_payment",
        total: amount,
        subtotalList: amount,
        totalFurooh: 0,
        giftCardPurchaseAmount: amount,
        giftCardRecipientName: payload.recipientName?.trim() || null,
        giftCardRecipientContact: payload.recipientContact?.trim() || null,
        shippingMethod: "digital",
      },
      include: { items: true },
    });

    const amountRial = tomanToRial(order.total);
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amountRial,
        status: "pending",
      },
    });

    try {
      const zarinpal = await zarinpalRequestPayment({
        amountRial,
        description: `خرید کارت هدیه — سفارش ${order.id}`,
        orderId: order.id,
        mobile: user.phone,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { authority: zarinpal.authority, fee: zarinpal.fee },
      });

      await logPaymentEvent({
        paymentId: payment.id,
        orderId: order.id,
        level: "info",
        event: "gift_card.payment.initiated",
        meta: { amountToman: amount, authority: zarinpal.authority },
      });

      return created({
        redirectUrl: zarinpal.redirectUrl,
        orderId: order.id,
        authority: zarinpal.authority,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zarinpal request failed";

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "failed", errorMessage: message },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: "payment_failed" },
        }),
      ]);

      await logPaymentEvent({
        paymentId: payment.id,
        orderId: order.id,
        level: "error",
        event: "gift_card.zarinpal.request.failed",
        message,
      });

      throw error;
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/gift-cards/purchase" });
  }
}
