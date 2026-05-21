import type { Product } from "@/lib/types";

export type ProductSearchResponse = {
  query: string;
  products: {
    catalog: Product[];
    telegram: unknown[];
  };
};

export async function fetchProductSearch(
  query: string,
  signal?: AbortSignal
): Promise<ProductSearchResponse | null> {
  const q = query.trim();
  if (!q) return null;

  const response = await fetch(`/api/products/search?${new URLSearchParams({ q })}`, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as ProductSearchResponse;
}
