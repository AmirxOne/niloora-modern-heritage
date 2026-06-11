import { getProductPricing } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";

type ProductSearchFields = Pick<
  Product,
  "name" | "namePersian" | "collection" | "listing" | "stone" | "category"
>;

type ProductPricingFields = Pick<Product, "price" | "listPrice" | "discountPercent">;

/** Canonical sale/list/discount fields — same rules as ProductCard + cart sanitize. */
export function normalizeCatalogProductPricing(
  product: ProductPricingFields
): ProductPricingFields {
  const pricing = getProductPricing(product);
  return {
    price: pricing.salePrice,
    listPrice: pricing.hasProductFurooh ? pricing.listPrice : undefined,
    discountPercent: pricing.hasProductFurooh ? pricing.furoohPercent : undefined,
  };
}

export function getProductSearchHaystack(product: ProductSearchFields): string {
  return [
    product.name,
    product.namePersian,
    product.category,
    fa.shop.styles[product.category],
    product.stone,
    fa.stones[product.stone],
    product.collection ?? "",
    product.listing?.headline ?? "",
    ...(product.listing?.details ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function normalizeSearchText(input: string): string {
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

function tokenizeSearchText(input: string): string[] {
  const normalized = normalizeSearchText(input);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function boundedLevenshtein(a: string, b: string, maxDistance: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > maxDistance) return maxDistance + 1;
  if (a === b) return 0;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prev = new Array<number>(bl + 1);
  let curr = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j += 1) prev[j] = j;

  for (let i = 1; i <= al; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= bl; j += 1) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

type SearchIndexedProduct = {
  product: ProductSearchFields;
  normalizedHaystack: string;
  tokens: string[];
};

function buildSearchIndex(product: ProductSearchFields): SearchIndexedProduct {
  const haystack = getProductSearchHaystack(product);
  const normalizedHaystack = normalizeSearchText(haystack);
  const tokens = tokenizeSearchText(haystack);
  return { product, normalizedHaystack, tokens };
}

function maxTokenDistance(queryToken: string): number {
  if (queryToken.length <= 4) return 1;
  return 2;
}

function scoreIndexedProduct(indexed: SearchIndexedProduct, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;
  const queryTokens = tokenizeSearchText(normalizedQuery);
  if (queryTokens.length === 0) return 0;

  let score = 0;

  if (indexed.normalizedHaystack.includes(normalizedQuery)) score += 120;

  for (const queryToken of queryTokens) {
    let best = 0;
    for (const token of indexed.tokens) {
      if (!token) continue;
      if (token === queryToken) {
        best = Math.max(best, 40);
        continue;
      }
      if (token.startsWith(queryToken) || queryToken.startsWith(token)) {
        best = Math.max(best, 24);
        continue;
      }
      const maxDist = maxTokenDistance(queryToken);
      const dist = boundedLevenshtein(queryToken, token, maxDist);
      if (dist <= maxDist) {
        const typoScore = Math.max(8, 22 - dist * 6);
        if (typoScore > best) best = typoScore;
      }
    }
    score += best;
  }

  return score;
}

export function matchesProductSearchQuery(product: ProductSearchFields, query: string): boolean {
  return scoreIndexedProduct(buildSearchIndex(product), query) > 0;
}

export function searchProductsFuzzy<T extends ProductSearchFields>(products: T[], query: string): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const scored = products
    .map((product) => {
      const indexed = buildSearchIndex(product);
      const score = scoreIndexedProduct(indexed, normalizedQuery);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.product);
}

/**
 * Keyword (term) suggestions surfaced alongside product hits: matching
 * collection names, stone labels, and style labels. Helps users refine a query
 * even when the exact product isn't in the preview list.
 */
export function buildSearchSuggestions(
  products: Array<Pick<Product, "collection" | "stone" | "category">>,
  query: string,
  limit = 5
): string[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const candidates = new Set<string>();
  for (const product of products) {
    if (product.collection) candidates.add(product.collection);
    const stoneLabel = fa.stones[product.stone];
    if (stoneLabel) candidates.add(stoneLabel);
    const styleLabel = fa.shop.styles[product.category];
    if (styleLabel) candidates.add(styleLabel);
  }

  const matches: string[] = [];
  for (const candidate of Array.from(candidates)) {
    const normalizedCandidate = normalizeSearchText(candidate);
    if (!normalizedCandidate || normalizedCandidate === normalizedQuery) continue;
    if (normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate)) {
      matches.push(candidate);
    }
    if (matches.length >= limit) break;
  }
  return matches;
}

export function getCatalogMaxPrice(catalog: Pick<Product, "price">[]): number {
  if (catalog.length === 0) return 0;
  return Math.max(...catalog.map((p) => p.price));
}
