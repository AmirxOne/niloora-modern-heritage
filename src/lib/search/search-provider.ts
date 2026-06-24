import type { SearchProvider } from "@/lib/search/types";
import { localSearchAdapter } from "@/lib/search/local-search-adapter";

const meilisearchStubAdapter: SearchProvider = {
  async indexProduct() {
    throw new Error("MEILISEARCH_NOT_CONFIGURED");
  },
  async updateProduct() {
    throw new Error("MEILISEARCH_NOT_CONFIGURED");
  },
  async removeProduct() {
    throw new Error("MEILISEARCH_NOT_CONFIGURED");
  },
  async searchProducts() {
    throw new Error("MEILISEARCH_NOT_CONFIGURED");
  },
};

export function getSearchProviderName(): "local" | "meilisearch" {
  const raw = process.env.SEARCH_PROVIDER?.trim().toLowerCase();
  return raw === "meilisearch" ? "meilisearch" : "local";
}

export function getSearchAdapter(): SearchProvider {
  return getSearchProviderName() === "meilisearch" ? meilisearchStubAdapter : localSearchAdapter;
}
