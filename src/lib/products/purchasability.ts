import type { ProductAvailability } from "@/lib/types";

export type PurchasableProduct = {
  id?: string;
  name?: string;
  availability: ProductAvailability | string;
  stock: number;
};

export type PurchaseBlockCode = "sold" | "out_of_stock" | "insufficient_stock";

export type PurchaseBlockReason = {
  code: PurchaseBlockCode;
  message: string;
};

export function getPurchaseBlockReason(
  product: PurchasableProduct,
  requestedQty: number
): PurchaseBlockReason | null {
  const qty = Math.max(1, Math.floor(requestedQty));
  const stock = Math.max(0, Math.floor(product.stock));

  if (product.availability === "sold") {
    return {
      code: "sold",
      message: product.name
        ? `«${product.name}» فروخته شده و قابل خرید نیست.`
        : "این اثر فروخته شده و قابل خرید نیست.",
    };
  }

  if (stock <= 0) {
    return {
      code: "out_of_stock",
      message: product.name
        ? `موجودی «${product.name}» تمام شده است.`
        : "موجودی این اثر تمام شده است.",
    };
  }

  if (qty > stock) {
    return {
      code: "insufficient_stock",
      message: product.name
        ? `موجودی «${product.name}» کافی نیست (حداکثر ${stock.toLocaleString("fa-IR")} عدد).`
        : `موجودی کافی نیست (حداکثر ${stock.toLocaleString("fa-IR")} عدد).`,
    };
  }

  return null;
}

export function isProductPurchasable(
  product: PurchasableProduct,
  requestedQty: number
): boolean {
  return getPurchaseBlockReason(product, requestedQty) === null;
}

export function aggregateQuantityByProductId(
  items: Array<{ productId?: string; quantity: number }>
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) continue;
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
  }
  return totals;
}
