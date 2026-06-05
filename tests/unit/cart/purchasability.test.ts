import {
  aggregateQuantityByProductId,
  getPurchaseBlockReason,
  isProductPurchasable,
} from "@/lib/products/purchasability";
import { soldProduct, sampleProduct } from "../../fixtures/products";

describe("Cart — purchasability", () => {
  it("blocks sold products", () => {
    const reason = getPurchaseBlockReason(soldProduct, 1);
    expect(reason?.code).toBe("sold");
    expect(isProductPurchasable(soldProduct, 1)).toBe(false);
  });

  it("blocks quantity above stock", () => {
    const reason = getPurchaseBlockReason(sampleProduct, 2);
    expect(reason?.code).toBe("insufficient_stock");
  });

  it("allows purchase within stock", () => {
    expect(isProductPurchasable(sampleProduct, 1)).toBe(true);
  });

  it("aggregates quantities per product id", () => {
    const totals = aggregateQuantityByProductId([
      { productId: "a", quantity: 1 },
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 },
    ]);
    expect(totals.get("a")).toBe(3);
    expect(totals.get("b")).toBe(1);
  });
});
