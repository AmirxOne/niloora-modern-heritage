import { computeShippingCost } from "@/lib/orders/shipping-cost";

describe("Checkout — shipping cost", () => {
  it("quotes Tehran zone for Tehran province", () => {
    const quote = computeShippingCost({
      province: "تهران",
      city: "تهران",
      shippingMethod: "standard",
    });
    expect(quote.ready).toBe(true);
    expect(quote.zone).toBe("tehran");
    expect(quote.cost).toBeGreaterThan(0);
  });

  it("adds express surcharge", () => {
    const standard = computeShippingCost({
      province: "تهران",
      city: "تهران",
      shippingMethod: "standard",
    });
    const express = computeShippingCost({
      province: "تهران",
      city: "تهران",
      shippingMethod: "express_tehran",
    });
    expect(express.cost).toBeGreaterThan(standard.cost);
  });

  it("returns not ready without province", () => {
    const quote = computeShippingCost({
      province: "",
      city: "تهران",
      shippingMethod: "standard",
    });
    expect(quote.ready).toBe(false);
  });
});
