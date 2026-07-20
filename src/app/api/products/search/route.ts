export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { buildSearchSuggestions, searchProductsFuzzy } from "@/lib/catalog/product-catalog";
import { findProductByPieceCode, isValidPieceCode, normalizePieceCode } from "@/lib/products/piece-code";
import { getCatalogProducts } from "@/lib/server/products";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

const MAX_SEARCH_QUERY_LENGTH = 120;

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
  const critical = createCriticalFlowContext(request, {
    route: "/api/products/search",
    role: "guest",
    journey: "browse_search",
    action: "catalog_search",
  });
  logCriticalStart(critical);
  try {
    const url = new URL(request.url);
    const rawQuery = (url.searchParams.get("q") ?? "").trim();
    const query = rawQuery.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (!query) {
      logCriticalOutcome(critical, "blocked", { code: "missing_query" });
      return withCorrelationId(badRequest("q is required"), critical.correlationId);
    }
    if (query.length > MAX_SEARCH_QUERY_LENGTH) {
      logCriticalOutcome(critical, "blocked", { code: "query_too_long", queryLength: query.length });
      return withCorrelationId(
        badRequest(`q must be <= ${MAX_SEARCH_QUERY_LENGTH} characters`),
        critical.correlationId
      );
    }

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

    logCriticalOutcome(critical, "success", { queryLength: query.length, resultCount: catalogProducts.length });
    return withCorrelationId(
      ok({
      query,
      normalizedQuery: normalizeQueryForResponse(query),
      suggestions: buildSearchSuggestions(catalog, query),
      products: {
        catalog: catalogProducts,
      },
      }),
      critical.correlationId
    );
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    return handleRouteError(error, {
      route: "/api/products/search",
      request,
      role: "guest",
      journey: "browse_search",
      action: "catalog_search",
    });
  }
}
