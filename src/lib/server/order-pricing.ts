import { getSiteWideDiscountConfig } from "@/lib/server/home/home-banner";
import { resolveCartLine } from "@/lib/server/orders/resolve-cart-line";
import type { CartItem } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import { validateCartPurchase } from "@/lib/server/products/validate-cart-purchase";
import { calcPromoFromCode } from "@/lib/server/promo/promo-code-service";

export type PricedOrder = {
  items: Array<CartItem & { quantity: number }>;
  subtotalList: number;
  subtotalSale: number;
  totalFurooh: number;
  payable: number;
  promoCode: string | null;
};

/**
 * Authoritative checkout pricing. Client `price` / `listPrice` on cart lines are ignored.
 * Used by payment initiation (`createOrderFromCart`) — not by deprecated direct POST /api/orders.
 */
export async function repriceOrderItems(
  incomingItems: CartItem[],
  promoCode: string | null
): Promise<PricedOrder> {
  const positiveItems = incomingItems.filter((item) => item.quantity > 0);
  if (positiveItems.length === 0) {
    return {
      items: [],
      subtotalList: 0,
      subtotalSale: 0,
      totalFurooh: 0,
      payable: 0,
      promoCode: null,
    };
  }

  await validateCartPurchase(positiveItems);

  const productIds = positiveItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          price: true,
          listPrice: true,
          discountPercent: true,
          image: true,
          availability: true,
        },
      })
    : [];

  const byId = new Map(
    products.map((product) => [
      product.id,
      {
        ...product,
        availability: product.availability as import("@/lib/types").ProductAvailability,
      },
    ])
  );
  const items = positiveItems.map((item) => resolveCartLine(item, byId));

  const subtotalList = items.reduce(
    (sum, item) => sum + (item.listPrice ?? item.price) * item.quantity,
    0
  );
  const subtotalSale = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productFurooh = subtotalList - subtotalSale;

  const promo = await calcPromoFromCode(subtotalSale, promoCode);
  const siteWideDiscount = await getSiteWideDiscountConfig();

  let siteWide = 0;
  if (
    siteWideDiscount.enabled &&
    siteWideDiscount.percent > 0 &&
    !promo.replacesSiteWide
  ) {
    siteWide = Math.round(
      (subtotalSale - promo.amount) * (siteWideDiscount.percent / 100)
    );
  }

  const checkoutFurooh = promo.amount + siteWide;
  const totalFurooh = Math.max(0, productFurooh + checkoutFurooh);
  const payable = Math.max(0, subtotalSale - checkoutFurooh);

  return {
    items,
    subtotalList,
    subtotalSale,
    totalFurooh,
    payable,
    promoCode: promo.normalizedCode,
  };
}
