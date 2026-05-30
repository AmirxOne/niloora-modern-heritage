import { describe, expect, it } from "vitest";
import type { RingCustomizationConfigDto } from "@/lib/types/ring-customization";
import { calculateRingPurchaseCustomization } from "@/lib/ring-purchase-customization/pricing";

const baseConfig: RingCustomizationConfigDto = {
  id: "cfg-1",
  productId: "prod-1",
  enabled: true,
  sizeBase: 50,
  sizeMin: 45,
  sizeMax: 55,
  sizePricingMode: "step",
  sizeFixedDelta: 0,
  sizeStepAmount: 100_000,
  shankEnabled: true,
  shankDefaultIncluded: true,
  shankDefaultRemovalCredit: 900_000,
  stoneEnabled: true,
  stoneDefaultIncluded: true,
  stoneDefaultRemovalCredit: 600_000,
  baseLeadTimeDays: 1,
  sizeLeadTimeDays: 0,
  shankLeadTimeDays: 2,
  stoneLeadTimeDays: 3,
};

describe("calculateRingPurchaseCustomization", () => {
  it("applies step pricing for size change", () => {
    const result = calculateRingPurchaseCustomization(baseConfig, {
      productId: "prod-1",
      size: { selected: 53 },
    });
    expect(result.totalCustomizationDelta).toBe(300_000);
    expect(result.size?.selected).toBe(53);
  });

  it("applies opt-out credits as negative delta", () => {
    const result = calculateRingPurchaseCustomization(baseConfig, {
      productId: "prod-1",
      shank: { state: "opted_out" },
      stone: { state: "opted_out" },
    });
    expect(result.totalCustomizationDelta).toBe(-1_500_000);
  });

  it("adds artisan and style prices for customized branches", () => {
    const result = calculateRingPurchaseCustomization(baseConfig, {
      productId: "prod-1",
      shank: { state: "customized", artisanPriceAdd: 400_000, patternPriceAdd: 500_000 },
      stone: {
        state: "customized",
        artisanPriceAdd: 300_000,
        textPriceAdd: 200_000,
        scriptStylePriceAdd: 100_000,
      },
    });
    expect(result.totalCustomizationDelta).toBe(1_500_000);
    expect(result.leadTimeDaysDelta).toBe(6);
  });
});

