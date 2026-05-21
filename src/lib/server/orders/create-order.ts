import type { Prisma } from "@prisma/client";
import type { CheckoutShippingInput } from "@/lib/checkout/shipping";
import { computeShippingCost } from "@/lib/orders/shipping-cost";
import { CartPurchaseError } from "@/lib/server/products/validate-cart-purchase";
import { prisma } from "@/lib/server/prisma";
import { repriceOrderItems } from "@/lib/server/order-pricing";
import type { CartItem } from "@/lib/types";

export { CartPurchaseError };

export function createOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `HS-${stamp.slice(-8)}`;
}

export async function createOrderFromCart(input: {
  userId: string;
  items: CartItem[];
  promoCode: string | null;
  status: string;
  shipping: CheckoutShippingInput;
}) {
  const priced = await repriceOrderItems(input.items, input.promoCode);
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
  const orderTotal = priced.payable + shippingCost;

  const order = await prisma.order.create({
    data: {
      id: createOrderId(),
      userId: input.userId,
      status: input.status,
      total: orderTotal,
      subtotalList: priced.subtotalList,
      totalFurooh: priced.totalFurooh,
      promoCode: priced.promoCode,
      shippingName: input.shipping.fullName,
      shippingPhone: input.shipping.mobile,
      shippingProvince: input.shipping.province,
      shippingCity: input.shipping.city,
      shippingAddress: input.shipping.address,
      shippingPostalCode: input.shipping.postalCode,
      orderNote: input.shipping.orderNote || null,
      shippingMethod: input.shipping.shippingMethod,
      shippingCost,
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
        })),
      },
    },
    include: { items: true },
  });

  return { order, priced, shippingCost, orderTotal };
}
