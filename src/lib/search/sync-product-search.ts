import { getProductSearchHaystack } from "@/lib/catalog/product-catalog";
import { buildSearchProductDocument } from "@/lib/search/local-search-adapter";
import { getSearchAdapter } from "@/lib/search/search-provider";
import { isMarketplaceCatalogFilterEnabled } from "@/lib/server/marketplace/feature-flags";
import { getProductByIdFromDb } from "@/lib/server/products";
import type { Product } from "@/lib/types";

function isProductSearchVisible(product: Product): boolean {
  if (!isMarketplaceCatalogFilterEnabled()) {
    return true;
  }

  if (product.publicationStatus && product.publicationStatus !== "published") {
    return false;
  }

  if (product.vendorId && product.vendor?.status !== "active") {
    return false;
  }

  return true;
}

export async function syncProductSearchIndex(productId: string): Promise<void> {
  const adapter = getSearchAdapter();
  const product = await getProductByIdFromDb(productId);

  if (!product || !isProductSearchVisible(product)) {
    await adapter.removeProduct(productId);
    return;
  }

  const document = buildSearchProductDocument(product, getProductSearchHaystack(product));
  await adapter.indexProduct(document);
}

export async function syncProductSearchIndexSafe(productId: string): Promise<void> {
  try {
    await syncProductSearchIndex(productId);
  } catch (error) {
    console.error("product search sync failed", productId, error);
  }
}

export async function removeProductFromSearchIndex(productId: string): Promise<void> {
  await getSearchAdapter().removeProduct(productId);
}

export async function searchIndexedProducts(
  query: string,
  options?: { limit?: number }
): Promise<Product[]> {
  return getSearchAdapter().searchProducts(query, options);
}
