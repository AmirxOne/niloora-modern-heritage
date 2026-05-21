import { resolveCheckoutUser } from "@/lib/server/auth/checkout-user";
import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { CartPurchaseError, createOrderFromCart } from "@/lib/server/orders/create-order";
import { toOrderDto } from "@/lib/server/orders/order-dto";
import { parseAndValidateShippingPayload } from "@/lib/server/orders/validate-shipping";
import { logPaymentEvent } from "@/lib/server/payment/log";
import {
  isZarinpalConfigured,
  tomanToRial,
  zarinpalRequestPayment,
} from "@/lib/server/payment/zarinpal";
import { prisma } from "@/lib/server/prisma";
import type { CartItem } from "@/lib/types";

type Body = {
  items?: CartItem[];
  promoCode?: string | null;
  shipping?: unknown;
};

export async function POST(request: Request) {
  try {
    const sessionUser = await readSessionUser();

    if (!isZarinpalConfigured()) {
      return badRequest("درگاه پرداخت پیکربندی نشده است.");
    }

    const payload = (await request.json()) as Body;
    const items = payload.items ?? [];
    if (items.length === 0) {
      return badRequest("سبد خرید خالی است.");
    }
    // Client line prices are discarded — createOrderFromCart → repriceOrderItems reprices from DB/catalog.

    const shippingResult = parseAndValidateShippingPayload(payload.shipping);
    if (!shippingResult.ok) {
      return badRequest(shippingResult.message);
    }

    let checkoutUser = sessionUser;
    if (!checkoutUser) {
      try {
        checkoutUser = await resolveCheckoutUser({
          phone: shippingResult.shipping.mobile,
          fullName: shippingResult.shipping.fullName,
          email: shippingResult.shipping.email || null,
        });
      } catch {
        return badRequest("شماره موبایل برای ثبت سفارش معتبر نیست.");
      }
    }

    let orderResult;
    try {
      orderResult = await createOrderFromCart({
        userId: checkoutUser.id,
        items,
        promoCode: payload.promoCode ?? null,
        status: "pending_payment",
        shipping: shippingResult.shipping,
      });
    } catch (error) {
      if (error instanceof CartPurchaseError) {
        return badRequest(error.message);
      }
      throw error;
    }
    const { order, priced, shippingCost } = orderResult;

    const amountRial = tomanToRial(order.total);

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amountRial,
        status: "pending",
      },
    });

    await logPaymentEvent({
      paymentId: payment.id,
      orderId: order.id,
      level: "info",
      event: "payment.initiated",
      message: "Order created, requesting Zarinpal authority",
      meta: {
        amountRial,
        amountToman: order.total,
        itemsToman: priced.payable,
        shippingCost,
      },
    });

    try {
      const zarinpal = await zarinpalRequestPayment({
        amountRial,
        description: `سفارش ${order.id} — گالری ابراهیم آذری`,
        orderId: order.id,
        mobile: shippingResult.shipping.mobile,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { authority: zarinpal.authority, fee: zarinpal.fee },
      });

      await logPaymentEvent({
        paymentId: payment.id,
        orderId: order.id,
        level: "info",
        event: "zarinpal.request.success",
        meta: { authority: zarinpal.authority },
      });

      return created({
        redirectUrl: zarinpal.redirectUrl,
        orderId: order.id,
        authority: zarinpal.authority,
        order: toOrderDto(order),
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
        event: "zarinpal.request.failed",
        message,
      });

      return serverError("ایجاد تراکنش درگاه ناموفق بود.");
    }
  } catch (error) {
    return handleRouteError(error, { route: "/api/payments/zarinpal/request" });
  }
}
