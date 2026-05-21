import { calculateCustomizerPrice } from "@/lib/customizer-pricing";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import { getProductPricing } from "@/lib/pricing";
import { sanitizeCustomizer } from "@/lib/store/customizer-utils";
import { CartPurchaseError } from "@/lib/server/products/validate-cart-purchase";
import type { CartItem, CustomizerState, Product } from "@/lib/types";

export type ResolvedCartLine = CartItem & { quantity: number };

export type DbProduct = {
  id: string;
  name: string;
  price: number;
  listPrice?: number | null;
  discountPercent?: number | null;
  image: string;
  availability: Product["availability"];
};

/** Catalog line — prices always from DB, never from client payload. */
export function resolveCatalogCartLine(item: CartItem, product: DbProduct): ResolvedCartLine {
  const pricing = getProductPricing({
    price: product.price,
    listPrice: product.listPrice ?? undefined,
    discountPercent: product.discountPercent ?? undefined,
  });

  return {
    id: item.id,
    productId: product.id,
    name: product.name,
    image: product.image,
    availability: product.availability,
    quantity: item.quantity,
    price: pricing.salePrice,
    listPrice: pricing.listPrice,
    customizerState: undefined,
  };
}

/** Custom atelier line — price from server-side calculator only. */
export function resolveCustomDesignCartLine(item: CartItem): ResolvedCartLine {
  if (!item.customizerState) {
    throw new CartPurchaseError("پیکربندی سفارشی معتبر نیست.", { code: "invalid_custom" });
  }

  const { state } = sanitizeCustomizer(item.customizerState as CustomizerState);
  const unitPrice = calculateCustomizerPrice(state);

  return {
    id: item.id,
    name: item.name?.trim() || "انگشتر سفارشی",
    image: item.image || DEFAULT_PRODUCT_IMAGE,
    quantity: item.quantity,
    price: unitPrice,
    listPrice: unitPrice,
    customizerState: state,
    productId: undefined,
  };
}

export function resolveCartLine(
  item: CartItem,
  productsById: Map<string, DbProduct>
): ResolvedCartLine {
  if (item.quantity < 1) {
    throw new CartPurchaseError("تعداد نامعتبر در سبد.", { code: "invalid_quantity" });
  }

  if (item.customizerState) {
    return resolveCustomDesignCartLine(item);
  }

  if (item.productId) {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CartPurchaseError("برخی اقلام سبد در گالری موجود نیستند.", {
        productId: item.productId,
        code: "not_found",
      });
    }
    return resolveCatalogCartLine(item, product);
  }

  throw new CartPurchaseError("قلم سبد باید محصول گالری یا طرح سفارشی باشد.", {
    code: "invalid_line",
  });
}
