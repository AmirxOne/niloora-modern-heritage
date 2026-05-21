import type { Product } from "@/lib/types";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts, getCatalogMaxPrice } from "@/lib/server/products";
import { listTelegramProducts } from "@/lib/server/telegram/sync";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get("source");
    const q = url.searchParams.get("q") ?? undefined;
    const channel = url.searchParams.get("channel") ?? undefined;
    if (source === "telegram") {
      const products = await listTelegramProducts({ query: q, channel, limit: 500 });
      return ok({ products });
    }

    const products = await getCatalogProducts();
    const telegramProducts = await listTelegramProducts({ query: q, channel, limit: 200 });
    return ok({
      products,
      maxPrice: getCatalogMaxPrice(products),
      telegramProducts,
    } satisfies { products: Product[]; maxPrice: number; telegramProducts: unknown[] });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products" });
  }
}
