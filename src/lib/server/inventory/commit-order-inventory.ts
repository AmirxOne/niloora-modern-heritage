import type { PrismaClient } from "@prisma/client";
import { aggregateQuantityByProductId } from "@/lib/products/purchasability";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export class InventoryCommitError extends Error {
  code: string;
  productId?: string;

  constructor(message: string, options?: { code?: string; productId?: string }) {
    super(message);
    this.name = "InventoryCommitError";
    this.code = options?.code ?? "inventory_commit_failed";
    this.productId = options?.productId;
  }
}

export async function commitInventoryForPaidOrder(
  tx: PrismaTx,
  items: Array<{ productId?: string | null; quantity: number }>
): Promise<void> {
  const totals = aggregateQuantityByProductId(items);
  if (totals.size === 0) return;

  for (const [productId, quantity] of Array.from(totals.entries())) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, availability: true },
    });

    if (!product) {
      throw new InventoryCommitError("برخی اقلام سفارش دیگر در گالری موجود نیستند.", {
        code: "not_found",
        productId,
      });
    }

    if (product.availability === "sold" || product.stock < quantity) {
      throw new InventoryCommitError(
        product.name
          ? `موجودی «${product.name}» برای تکمیل سفارش کافی نیست.`
          : "موجودی برخی اقلام برای تکمیل سفارش کافی نیست.",
        { code: "insufficient_stock", productId }
      );
    }

    const nextStock = product.stock - quantity;
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: nextStock,
        availability: nextStock <= 0 ? "sold" : product.availability,
      },
    });
  }
}
