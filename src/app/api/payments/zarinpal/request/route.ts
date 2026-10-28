import { resolveCheckoutUser } from "@/lib/server/auth/checkout-user";
import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, serverError, tooManyRequests } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { CartPurchaseError, createOrderFromCart } from "@/lib/server/orders/create-order";
import { validateCartPurchase } from "@/lib/server/products/validate-cart-purchase";
import { toOrderDto } from "@/lib/server/orders/order-dto";
import { parseAndValidateShippingPayload } from "@/lib/server/orders/validate-shipping";
import { checkRateLimit, createRateLimitKey } from "@/lib/server/rate-limit";
import { logPaymentEvent } from "@/lib/server/payment/log";
import {
  isZarinpalConfigured,
  tomanToRial,
  zarinpalRequestPayment,
  zarinpalStartPayUrl,
} from "@/lib/server/payment/zarinpal";
import { prisma } from "@/lib/server/prisma";
import type { CartItem } from "@/lib/types";

type Body = {
  items?: CartItem[];
  promoCode?: string | null;
  shipping?: unknown;
};

/**
 * A (very likely accidental) duplicate submission: the same user, with a
 * pending payment younger than IDEMPOTENCY_WINDOW_MS, is treated as a retry
 * of that payment instead of creating a second order.
 */
const IDEMPOTENCY_WINDOW_MS = 5 * 60_000;

function stableCartSignature(items: CartItem[]): string {
  const parts = items
    .map((item) => `${item.productId ?? "custom"}:${item.name}:${item.quantity}`)
    .sort();
  return parts.join("|");
}

async function findReusablePendingPayment(input: {
  userId: string;
  signature: string;
  promoCode: string | null;
}): Promise<{ orderId: string; authority: string; total: number } | null> {
  const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
  const candidates = await prisma.order.findMany({
    where: {
      userId: input.userId,
      status: "pending_payment",
      createdAt: { gte: since },
    },
    include: { payment: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const order of candidates) {
    const payment = order.payment;
    if (!payment || payment.status !== "pending" || !payment.authority) continue;
    if (order.promoCode !== input.promoCode) continue;

    const signature = stableCartSignature(
      order.items.map((item) => ({
        productId: item.productId ?? undefined,
        name: item.name,
        quantity: item.quantity,
      })) as CartItem[]
    );
    if (signature !== input.signature) continue;

    return { orderId: order.id, authority: payment.authority, total: order.total };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const sessionUser = await readSessionUser();

    // Payment initiation mutates DB and talks to the gateway — throttle it.
    const rateKey = createRateLimitKey(
      "payment:request",
      request,
      sessionUser?.id ?? ""
    );
    const rate = checkRateLimit(rateKey, 10, 60_000);
    if (!rate.allowed) {
      return tooManyRequests(
        "درخواست‌های پرداخت زیاد است. کمی بعد تلاش کنید.",
        rate.retryAfterSec,
        "payment_rate_limited"
      );
    }

    // ORDER OF CHECKS: payload validation FIRST (cart, shipping, stock),
    // gateway configuration LAST — so clients get meaningful errors and
    // stock problems never depend on whether the gateway is configured.
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

    // stock/availability validation happens inside createOrderFromCart
    // (repriceOrderItems → validateCartPurchase). Run it as a pre-check by
    // validating the cart BEFORE the gateway check so meaningful errors win.
    try {
      await validateCartPurchase(items);
    } catch (error) {
      if (error instanceof CartPurchaseError) {
        return badRequest(error.message);
      }
      throw error;
    }

    if (!isZarinpalConfigured()) {
      return badRequest("درگاه پرداخت پیکربندی نشده است.");
    }

    // IDEMPOTENCY: an accidental double submission (double-click / retry)
    // within the window reuses the still-pending payment instead of
    // creating a duplicate order + gateway request.
    const reusable = await findReusablePendingPayment({
      userId: checkoutUser.id,
      signature: stableCartSignature(items),
      promoCode: payload.promoCode ?? null,
    });
    if (reusable) {
      await logPaymentEvent({
        orderId: reusable.orderId,
        level: "info",
        event: "payment.deduplicated",
        message: "Reusing pending payment for duplicate checkout submission",
        meta: { authority: reusable.authority },
      });
      return created({
        redirectUrl: zarinpalStartPayUrl(reusable.authority),
        orderId: reusable.orderId,
        authority: reusable.authority,
        reused: true,
      });
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
