import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts } from "@/lib/server/products";
import { listTelegramProducts } from "@/lib/server/telegram/sync";

function matchesCatalogQuery(product: {
  name: string;
  namePersian: string;
  listing: { details: string[]; headline: string };
  collection?: string;
}, query: string): boolean {
  const q = query.toLowerCase();
  const haystack = [
    product.name,
    product.namePersian,
    product.listing.headline,
    ...product.listing.details,
    product.collection ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    if (!query) return badRequest("q is required");

    const [catalog, telegramProducts] = await Promise.all([
      getCatalogProducts(),
      listTelegramProducts({ query, channel: url.searchParams.get("channel") ?? undefined, limit: 500 }),
    ]);

    const catalogProducts = catalog.filter((product) => matchesCatalogQuery(product, query));
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

