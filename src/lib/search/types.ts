import type { Product } from "@/lib/types";

export type SearchProductDocument = {
  id: string;
  haystack: string;
  product: Product;
};

export type SearchProductsOptions = {
  limit?: number;
};

export type SearchProvider = {
  indexProduct(document: SearchProductDocument): Promise<void>;
  updateProduct(document: SearchProductDocument): Promise<void>;
  removeProduct(productId: string): Promise<void>;
  searchProducts(query: string, options?: SearchProductsOptions): Promise<Product[]>;
};

export type SearchProviderName = "local" | "meilisearch";
