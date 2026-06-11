export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { buildSearchSuggestions, searchProductsFuzzy } from "@/lib/catalog/product-catalog";
import { findProductByPieceCode, isValidPieceCode, normalizePieceCode } from "@/lib/products/piece-code";
import { getCatalogProducts } from "@/lib/server/products";

function normalizeQueryForResponse(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u200C]/g, "")
    .replace(/[إأٱآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ی")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    if (!query) return badRequest("q is required");

    const catalog = await getCatalogProducts();

    let catalogProducts = searchProductsFuzzy(catalog, query);

    // SKU / piece-code lookup: if the query is a valid piece code, surface that
    // exact product first (deduplicated against the fuzzy results).
    const pieceCodeNeedle = normalizePieceCode(query);
    if (isValidPieceCode(pieceCodeNeedle)) {
      const direct = findProductByPieceCode(catalog, pieceCodeNeedle);
      if (direct) {
        catalogProducts = [direct, ...catalogProducts.filter((p) => p.id !== direct.id)];
      }
    }

    return ok({
      query,
      normalizedQuery: normalizeQueryForResponse(query),
      suggestions: buildSearchSuggestions(catalog, query),
      products: {
        catalog: catalogProducts,
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/products/search" });
  }
}
