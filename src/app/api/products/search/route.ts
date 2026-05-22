import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { matchesProductSearchQuery } from "@/lib/catalog/product-catalog";
import { getCatalogProducts } from "@/lib/server/products";
import { listTelegramProducts } from "@/lib/server/telegram/sync";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    if (!query) return badRequest("q is required");

    const [catalog, telegramProducts] = await Promise.all([
      getCatalogProducts(),
      listTelegramProducts({
        query,
        channel: url.searchParams.get("channel") ?? undefined,
        limit: 500,
      }),
    ]);

    const catalogProducts = catalog.filter((product) => matchesProductSearchQuery(product, query));
    return ok({
      query,
      products: {
        catalog: catalogProducts,
        telegram: telegramProducts,
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/search" });
  }
}
