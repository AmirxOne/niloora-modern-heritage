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

    const nextStock = product.stock - quantity;
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity },
        availability: { not: "sold" },
      },
      data: {
        stock: { decrement: quantity },
        ...(nextStock <= 0 ? { availability: "sold" as const } : {}),
      },
    });

    if (updated.count !== 1) {
      throw new InventoryCommitError(
        product.name
          ? `موجودی «${product.name}» برای تکمیل سفارش کافی نیست.`
          : "موجودی برخی اقلام برای تکمیل سفارش کافی نیست.",
        { code: "insufficient_stock", productId }
      );
    }

    await tx.inventoryLog.create({
      data: { productId, change: -quantity, reason: "order_paid" },
    });
  }
}
