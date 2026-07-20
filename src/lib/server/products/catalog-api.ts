import type { Product } from "@/lib/types";
import { badRequest } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  getCatalogMaxPrice,
  getCatalogMaxPriceFromDb,
  getCatalogProducts,
  type CatalogProductsPage,
} from "@/lib/server/products";

const MAX_LIMIT = 100;
const MAX_OFFSET = 20_000;

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseCatalogQuery(searchParams: URLSearchParams) {
  const limit = parsePositiveInt(searchParams.get("limit"));
  const offset = parsePositiveInt(searchParams.get("offset")) ?? 0;
  const cursor = searchParams.get("cursor")?.trim() || undefined;

  if (searchParams.has("limit") && limit == null) {
    return { error: badRequest("limit must be a positive integer") } as const;
  }
  if ((limit ?? 0) > MAX_LIMIT) {
    return { error: badRequest(`limit must be <= ${MAX_LIMIT}`) } as const;
  }
  if (searchParams.has("offset") && parsePositiveInt(searchParams.get("offset")) == null) {
    return { error: badRequest("offset must be a non-negative integer") } as const;
  }
  if (offset > MAX_OFFSET) {
    return { error: badRequest(`offset must be <= ${MAX_OFFSET}`) } as const;
  }

  return {
    paginated: limit != null || cursor != null,
    options: { limit, offset, cursor },
  } as const;
}

export async function handleCatalogProductsGet(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseCatalogQuery(searchParams);
  if ("error" in parsed) return parsed.error;

  if (!parsed.paginated) {
    const products = await getCatalogProducts();
    return Response.json({
      products,
      maxPrice: getCatalogMaxPrice(products),
    } satisfies { products: Product[]; maxPrice: number });
  }

  const page = (await getCatalogProducts(parsed.options)) as CatalogProductsPage;
  const maxPrice = await getCatalogMaxPriceFromDb();

  return Response.json({
    products: page.products,
    maxPrice,
    total: page.total,
    limit: page.limit,
    offset: page.offset,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  });
}

export async function GET(request: Request) {
  try {
    const response = await handleCatalogProductsGet(request);
    return response;
  } catch (error) {
    return handleRouteError(error, { route: "/api/products" });
  }
}
