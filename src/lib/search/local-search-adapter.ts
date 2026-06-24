import { searchProductsFuzzy } from "@/lib/catalog/product-catalog";
import type { Product } from "@/lib/types";
import type { SearchProductDocument, SearchProvider } from "@/lib/search/types";

const index = new Map<string, SearchProductDocument>();

export const localSearchAdapter: SearchProvider = {
  async indexProduct(document) {
    index.set(document.id, document);
  },

  async updateProduct(document) {
    index.set(document.id, document);
  },

  async removeProduct(productId) {
    index.delete(productId);
  },

  async searchProducts(query, options) {
    const products = Array.from(index.values()).map((entry) => entry.product);
    const hits = searchProductsFuzzy(products, query);
    const limit = options?.limit;
    return limit != null ? hits.slice(0, limit) : hits;
  },
};

/** Test helper — clears the in-process local index. */
export function resetLocalSearchIndex(): void {
  index.clear();
}

export function getLocalSearchIndexSize(): number {
  return index.size;
}

export function buildSearchProductDocument(product: Product, haystack: string): SearchProductDocument {
  return { id: product.id, haystack, product };
}
