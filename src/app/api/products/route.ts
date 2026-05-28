import type { Product } from "@/lib/types";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts, getCatalogMaxPrice } from "@/lib/server/products";

export async function GET(request: Request) {
  try {
    const products = await getCatalogProducts();
    return ok({
      products,
      maxPrice: getCatalogMaxPrice(products),
    } satisfies { products: Product[]; maxPrice: number });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products" });
  }
}
