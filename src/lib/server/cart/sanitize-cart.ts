import { getProductPricing } from "@/lib/pricing";
import {
  aggregateQuantityByProductId,
  getPurchaseBlockReason,
} from "@/lib/products/purchasability";
import type {
  AdjustedCartLine,
  CartRemovalReason,
  RemovedCartLine,
  SanitizeCartResult,
} from "@/lib/cart/sanitize-types";
import type { CartItem, ProductAvailability } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

export type { AdjustedCartLine, CartRemovalReason, RemovedCartLine, SanitizeCartResult };

type DbProduct = {
  id: string;
  name: string;
  namePersian: string | null;
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
  discountEndsAt: Date | null;
  image: string;
  availability: string;
  stock: number;
};

function displayName(product: DbProduct | undefined, fallback: string): string {
  return product?.namePersian || product?.name || fallback;
}

function refreshCatalogLine(item: CartItem, product: DbProduct): CartItem {
  const pricing = getProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
    discountEndsAt: product.discountEndsAt ?? undefined,
  });

  return {
    ...item,
    name: displayName(product, item.name),
    image: product.image || item.image,
    availability: product.availability as ProductAvailability,
    price: pricing.salePrice,
    listPrice: pricing.listPrice,
  };
}

function removalMessage(
  reason: CartRemovalReason,
  name: string
): string {
  if (reason === "not_found") {
    return name
      ? `«${name}» دیگر در گالری موجود نیست و از سبد حذف شد.`
      : "برخی اقلام دیگر در گالری موجود نیستند و از سبد حذف شدند.";
  }
  if (reason === "sold") {
    return name
      ? `«${name}» فروخته شده است و از سبد حذف شد.`
      : "اثر فروخته‌شده از سبد حذف شد.";
  }
  return name
    ? `موجودی «${name}» تمام شده و از سبد حذف شد.`
    : "اقلام ناموجود از سبد حذف شدند.";
}

/**
 * Drop or fix cart lines that are no longer purchasable; refresh prices from DB for catalog lines.
 */
export async function sanitizeCartItems(items: CartItem[]): Promise<SanitizeCartResult> {
  const removed: RemovedCartLine[] = [];
  const adjusted: AdjustedCartLine[] = [];
  const kept: CartItem[] = [];

  const catalogLines = items.filter((item) => item.productId && !item.customizerState);
  const productIds = Array.from(
    new Set(catalogLines.map((item) => item.productId).filter((id): id is string => Boolean(id)))
  );

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          namePersian: true,
          price: true,
          listPrice: true,
          discountPercent: true,
          discountEndsAt: true,
          image: true,
          availability: true,
          stock: true,
        },
      })
    : [];

  const byId = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (!item.productId || item.customizerState) {
      kept.push(item);
      continue;
    }

    const product = byId.get(item.productId);
    if (!product) {
      removed.push({
        id: item.id,
        name: item.name,
        productId: item.productId,
        reason: "not_found",
        message: removalMessage("not_found", item.name),
      });
      continue;
    }

    const block = getPurchaseBlockReason(
      {
        id: product.id,
        name: displayName(product, item.name),
        availability: product.availability,
        stock: product.stock,
      },
      item.quantity
    );

    if (block?.code === "sold" || block?.code === "out_of_stock") {
      removed.push({
        id: item.id,
        name: displayName(product, item.name),
        productId: item.productId,
        reason: block.code,
        message: block.message,
      });
      continue;
    }

    if (block?.code === "insufficient_stock") {
      const maxQty = Math.max(0, Math.floor(product.stock));
      if (maxQty <= 0) {
        removed.push({
          id: item.id,
          name: displayName(product, item.name),
          productId: item.productId,
          reason: "out_of_stock",
          message: removalMessage("out_of_stock", displayName(product, item.name)),
        });
        continue;
      }
      adjusted.push({
        id: item.id,
        name: displayName(product, item.name),
        productId: item.productId,
        previousQuantity: item.quantity,
        newQuantity: maxQty,
        message: block.message,
      });
      kept.push(refreshCatalogLine({ ...item, quantity: maxQty }, product));
      continue;
    }

    kept.push(refreshCatalogLine(item, product));
  }

  return { items: kept, removed, adjusted };
}

/** True when any catalog product id appears more than once (should not happen). */
export function hasDuplicateProductLines(items: CartItem[]): boolean {
  const totals = aggregateQuantityByProductId(items);
  const lineCount = items.filter((i) => i.productId && !i.customizerState).length;
  return lineCount > totals.size;
}
