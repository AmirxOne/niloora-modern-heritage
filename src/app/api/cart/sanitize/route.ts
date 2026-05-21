import { ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { sanitizeCartItems } from "@/lib/server/cart/sanitize-cart";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: CartItem[] };
    const items = Array.isArray(body.items) ? body.items : [];
    const result = await sanitizeCartItems(items);
    return ok(result);
  } catch (error) {
    return handleRouteError(error, { route: "/api/cart/sanitize" });
  }
}
