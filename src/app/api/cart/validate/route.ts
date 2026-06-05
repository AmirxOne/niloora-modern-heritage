export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  CartPurchaseError,
  validateAddToCart,
  validateCartPurchase,
} from "@/lib/server/products/validate-cart-purchase";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: CartItem[];
      productId?: string;
      quantity?: number;
      existingItems?: CartItem[];
    };

    if (body.productId) {
      const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1));
      const existingItems = Array.isArray(body.existingItems) ? body.existingItems : [];
      await validateAddToCart({
        productId: body.productId,
        quantity,
        existingItems,
      });
      return ok({ valid: true });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return badRequest("سبد خرید خالی است.");
    }

    await validateCartPurchase(body.items);
    return ok({ valid: true });
  } catch (error) {
    if (error instanceof CartPurchaseError) {
      return badRequest(error.message);
    }
    return handleRouteError(error, { route: "/api/cart/validate" });
  }
}
