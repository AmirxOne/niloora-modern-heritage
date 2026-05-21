import {
  aggregateQuantityByProductId,
  getPurchaseBlockReason,
} from "@/lib/products/purchasability";
import type { CartItem } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

export class CartPurchaseError extends Error {
  productId?: string;
  code?: string;

  constructor(message: string, options?: { productId?: string; code?: string }) {
    super(message);
    this.name = "CartPurchaseError";
    this.productId = options?.productId;
    this.code = options?.code;
  }
}

export async function validateCartPurchase(items: CartItem[]): Promise<void> {
  const totals = aggregateQuantityByProductId(items);
  if (totals.size === 0) return;

  const productIds = Array.from(totals.keys());
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, namePersian: true, availability: true, stock: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  for (const [productId, quantity] of Array.from(totals.entries())) {
    const product = byId.get(productId);
    if (!product) {
      throw new CartPurchaseError("برخی اقلام سبد در گالری موجود نیستند.", {
        productId,
        code: "not_found",
      });
    }

    const block = getPurchaseBlockReason(
      {
        id: product.id,
        name: product.namePersian || product.name,
        availability: product.availability,
        stock: product.stock,
      },
      quantity
    );

    if (block) {
      throw new CartPurchaseError(block.message, {
        productId,
        code: block.code,
      });
    }
  }
}

export async function validateAddToCart(input: {
  productId: string;
  quantity: number;
  existingItems: CartItem[];
}): Promise<void> {
  const merged: CartItem[] = [...input.existingItems];
  const existingLine = merged.find(
    (i) => i.productId === input.productId && !i.customizerState
  );
  if (existingLine) {
    existingLine.quantity += input.quantity;
  } else {
    merged.push({
      id: "draft",
      productId: input.productId,
      name: "",
      price: 0,
      quantity: input.quantity,
      image: "",
    });
  }
  await validateCartPurchase(merged);
}
