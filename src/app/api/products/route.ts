import type { Product } from "@/lib/types";
import { ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getCatalogProducts, getCatalogMaxPrice } from "@/lib/server/products";
import { listTelegramProducts } from "@/lib/server/telegram/sync";

const TELEGRAM_LIST_LIMIT = 60;
const MAX_PAGE_SIZE = 60;

/**
 * Catalog endpoint.
 * - Default (no `page`): full catalog + maxPrice — the shop UI filters/sorts
 *   client-side over the whole (small) catalog, so it needs the full list.
 * - With `page[&pageSize]`: server-side pagination for API consumers that
 *   don't need everything.
 * - Telegram feed is always capped (it is a side listing, not the catalog).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get("source");
    const q = url.searchParams.get("q") ?? undefined;
    const channel = url.searchParams.get("channel") ?? undefined;

    if (source === "telegram") {
      const products = await listTelegramProducts({ query: q, channel, limit: TELEGRAM_LIST_LIMIT });
      return ok({ products });
    }

    const products = await getCatalogProducts();

    const rawPage = url.searchParams.get("page");
    // lightweight client-side cache for identical repeat reads (shop
    // revisits, prefetch) — catalog freshness is governed by Redis TTL +
    // invalidation server-side
    const cacheHeaders = { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" };
    if (rawPage !== null) {
      const page = Math.max(1, Math.floor(Number(rawPage) || 1));
      const rawPageSize = Number(url.searchParams.get("pageSize") ?? "24");
      const pageSize =
        Number.isFinite(rawPageSize) && rawPageSize >= 1
          ? Math.min(MAX_PAGE_SIZE, Math.floor(rawPageSize))
          : 24;
      const total = products.length;
      const start = (page - 1) * pageSize;
      const paged = products.slice(start, start + pageSize);
      return ok({
        products: paged,
        maxPrice: getCatalogMaxPrice(products),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      }, { headers: cacheHeaders });
    }

    const telegramProducts = await listTelegramProducts({
      query: q,
      channel,
      limit: TELEGRAM_LIST_LIMIT,
    });
    return ok({
      products,
      maxPrice: getCatalogMaxPrice(products),
      telegramProducts,
    } satisfies { products: Product[]; maxPrice: number; telegramProducts: unknown[] }, { headers: cacheHeaders });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products" });
  }
}
