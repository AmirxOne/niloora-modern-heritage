import type { Prisma } from "@prisma/client";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import type { CheckoutPaymentMethod } from "@/lib/types";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import { calculateInstallmentAmount } from "@/lib/checkout/bnpl";
import { CartPurchaseError } from "@/lib/server/products/validate-cart-purchase";
import { prisma } from "@/lib/server/prisma";
import { recordCampaignUsage } from "@/lib/server/campaigns/discount-campaign-service";
import { repriceOrderItems } from "@/lib/server/order-pricing";
import {
  GiftCardReservationError,
  reserveGiftCardForOrder,
  validateGiftCardForCheckout,
} from "@/lib/server/gift-card/gift-card-service";
import type { CartItem } from "@/lib/types";
import { normalizeLoyaltyTier } from "@/lib/loyalty/program";

export { CartPurchaseError };

export function createOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `HS-${stamp.slice(-8)}`;
}

export async function createOrderFromCart(input: {
  userId: string;
  items: CartItem[];
  promoCode: string | null;
  giftCardCode?: string | null;
  loyaltyTier?: string | null;
  paymentMethod?: CheckoutPaymentMethod;
  installmentMonths?: number | null;
  status: string;
  shipping: CheckoutShippingInput;
}) {
  const priced = await repriceOrderItems(input.items, input.promoCode, {
    loyaltyTier: input.loyaltyTier,
  });
  if (priced.payable <= 0 || priced.items.length === 0) {
    throw new Error("Invalid order payload");
  }

  const shippingQuote = computeShippingCost({
    province: input.shipping.province,
    city: input.shipping.city,
    shippingMethod: input.shipping.shippingMethod,
  });
  if (!shippingQuote.ready) {
    throw new Error("Invalid shipping destination");
  }
  const shippingCost = shippingQuote.cost;
  let giftCardApplied = 0;
  let normalizedGiftCardCode: string | null = null;
  if (input.giftCardCode?.trim()) {
    const giftCardValidation = await validateGiftCardForCheckout(input.giftCardCode, priced.payable);
    if (!giftCardValidation.valid) {
      throw new CartPurchaseError("کارت هدیه معتبر نیست یا موجودی کافی ندارد.");
    }
    giftCardApplied = giftCardValidation.appliedAmount;
    normalizedGiftCardCode = giftCardValidation.giftCard.code;
  }

  const orderTotal = Math.max(0, priced.payable - giftCardApplied) + shippingCost;
  const paymentMethod = input.paymentMethod ?? "zarinpal";
  const installmentMonths = paymentMethod === "bnpl" ? (input.installmentMonths ?? null) : null;
  const installmentAmount =
    paymentMethod === "bnpl" && installmentMonths
      ? calculateInstallmentAmount(orderTotal, installmentMonths as 3 | 4 | 6)
      : null;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id: createOrderId(),
          userId: input.userId,
          status: input.status,
          total: orderTotal,
          subtotalList: priced.subtotalList,
          totalFurooh: priced.totalFurooh,
          bundleDiscount: priced.bundleDiscount,
          appliedBundles: priced.appliedBundles as unknown as Prisma.InputJsonValue,
          promoCode: priced.promoCode,
          giftCardCode: normalizedGiftCardCode,
          giftCardAppliedAmount: giftCardApplied || null,
          loyaltyTier: normalizeLoyaltyTier(input.loyaltyTier),
          loyaltyDiscountAmount: priced.loyaltyDiscountAmount || null,
          loyaltyPointsEarned: priced.loyaltyPointsEarned || null,
          campaignId: priced.campaignId,
          campaignDiscountAmount: priced.campaignDiscountAmount || null,
          shippingName: input.shipping.fullName,
          shippingPhone: input.shipping.mobile,
          shippingProvince: input.shipping.province,
          shippingCity: input.shipping.city,
          shippingAddress: input.shipping.address,
          shippingPostalCode: input.shipping.postalCode,
          orderNote: input.shipping.orderNote || null,
          shippingMethod: input.shipping.shippingMethod,
          shippingCost,
          paymentMethod,
          installmentMonths,
          installmentAmount,
          items: {
            create: priced.items.map((item) => ({
              productId: item.productId ?? null,
              name: item.name,
              price: item.price,
              listPrice: item.listPrice ?? null,
              quantity: item.quantity,
              image: item.image,
              availability: item.availability ?? null,
              customizerState: item.customizerState as Prisma.InputJsonValue | undefined,
              ringPurchaseCustomization:
                item.ringPurchaseCustomization as Prisma.InputJsonValue | undefined,
            })),
          },
        },
        include: { items: true },
      });

      if (giftCardApplied > 0 && normalizedGiftCardCode) {
        await reserveGiftCardForOrder({
          code: normalizedGiftCardCode,
          orderId: created.id,
          amount: giftCardApplied,
          tx,
        });
      }

      return created;
    });
  } catch (error) {
    if (error instanceof GiftCardReservationError) {
      throw new CartPurchaseError(error.message);
    }
    throw error;
  }

  if (priced.campaignId && priced.campaignDiscountAmount > 0) {
    await recordCampaignUsage({
      campaignId: priced.campaignId,
      orderId: order.id,
      userId: input.userId,
      discountAmount: priced.campaignDiscountAmount,
      orderSubtotal: priced.subtotalSale,
    });
  }

  return { order, priced, shippingCost, orderTotal, giftCardApplied, giftCardCode: normalizedGiftCardCode };
}
