import { describe, expect, it } from "vitest";
import { defaultCustomizerState, calculateCustomizerPrice } from "@/lib/customizer-pricing";
import {
  resolveCatalogCartLine,
  resolveCustomDesignCartLine,
} from "@/lib/server/orders/resolve-cart-line";
import type { CartItem } from "@/lib/types";

describe("resolveCartLine helpers", () => {
  it("resolveCatalogCartLine drops client price", () => {
    const line: CartItem = {
      id: "1",
      productId: "p1",
      name: "x",
      price: 100,
      listPrice: 100,
      quantity: 2,
      image: "/a.jpg",
    };
    const resolved = resolveCatalogCartLine(line, {
      id: "p1",
      name: "محصول واقعی",
      price: 3_000_000,
      listPrice: 3_500_000,
      discountPercent: null,
      image: "/db.jpg",
      availability: "ready",
    });
    expect(resolved.price).toBe(3_000_000);
    expect(resolved.quantity).toBe(2);
  });

  it("resolveCustomDesignCartLine uses calculator", () => {
    const expected = calculateCustomizerPrice(defaultCustomizerState);
    const resolved = resolveCustomDesignCartLine({
      id: "2",
      name: "طرح",
      price: 1,
      quantity: 1,
      image: "",
      customizerState: defaultCustomizerState,
    });
    expect(resolved.price).toBe(expected);
  });
});
