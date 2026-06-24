import { describe, expect, it } from "vitest";
import { calculateCommission } from "@/lib/server/marketplace/commission/calculate-commission";
import type { CommissionRuleSnapshot } from "@/lib/server/marketplace/commission/types";

const percentageRule = (value: number): CommissionRuleSnapshot => ({
  id: "rule-1",
  vendorId: "vendor-1",
  commissionType: "percentage",
  value,
});

const fixedRule = (value: number): CommissionRuleSnapshot => ({
  id: "rule-2",
  vendorId: "vendor-1",
  commissionType: "fixed",
  value,
});

describe("calculateCommission", () => {
  it("computes percentage commission with integer floor", () => {
    const result = calculateCommission(100_000, percentageRule(1000), 1);

    expect(result.commissionAmount).toBe(10_000);
    expect(result.netAmount).toBe(90_000);
  });

  it("computes 10% commission on 1,000,000 gross as 100,000", () => {
    const result = calculateCommission(1_000_000, percentageRule(1000), 1);

    expect(result.commissionAmount).toBe(100_000);
    expect(result.netAmount).toBe(900_000);
  });

  it("computes fixed per-unit commission", () => {
    const result = calculateCommission(150_000, fixedRule(5_000), 3);

    expect(result.commissionAmount).toBe(15_000);
    expect(result.netAmount).toBe(135_000);
  });

  it("caps commission at gross amount", () => {
    const result = calculateCommission(10_000, fixedRule(8_000), 2);

    expect(result.commissionAmount).toBe(10_000);
    expect(result.netAmount).toBe(0);
  });

  it("never returns negative net amount", () => {
    const result = calculateCommission(0, percentageRule(1000), 1);

    expect(result.commissionAmount).toBe(0);
    expect(result.netAmount).toBe(0);
  });
});
