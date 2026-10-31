import { badRequest, ok, serverError } from "@/lib/server/http";
import { cached } from "@/lib/server/cache";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts } from "@/lib/server/products";
import { listTelegramProducts } from "@/lib/server/telegram/sync";
import { normalizePersianSearch } from "@/lib/persian-normalize";

type SearchableProduct = {
  id: string;
  name: string;
  namePersian: string;
  listing: { details: string[]; headline: string };
  collection?: string;
};

/** Precomputed normalized search index — cached in Redis with the catalog. */
type CatalogSearchIndex = { productId: string; haystack: string }[];

async function getSearchIndex(products: SearchableProduct[]): Promise<CatalogSearchIndex> {
  return cached<CatalogSearchIndex>("catalog", "search-index", async () =>
    products.map((product) => ({
      productId: product.id,
      haystack: normalizePersianSearch(
        [
          product.name,
          product.namePersian,
          product.listing.headline,
          ...product.listing.details,
          product.collection ?? "",
        ].join(" ")
      ),
    }))
  );
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

    const q = normalizePersianSearch(query);
    const index = await getSearchIndex(catalog);
    const byId = new Map(catalog.map((product) => [product.id, product]));
    const catalogProducts = index
      .filter((entry) => entry.haystack.includes(q))
      .map((entry) => byId.get(entry.productId))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));
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

