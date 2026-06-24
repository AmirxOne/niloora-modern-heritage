import { describe, expect, it } from "vitest";
import type { VendorDashboardProducts } from "@/lib/server/vendor/vendor-dashboard-service";

function buildQuota(
  settings: { maxActiveProducts: number; maxPendingSubmissions: number; quotaMode: string },
  products: VendorDashboardProducts
) {
  const draftLike = products.draft + products.rejected;
  const pending = products.pending_review;
  const published = products.published;
  const quotaTotal = draftLike + pending + published;

  const atSubmitLimit = pending >= settings.maxPendingSubmissions;
  const atCreateLimit =
    settings.quotaMode !== "unlimited" &&
    quotaTotal >= settings.maxActiveProducts + settings.maxPendingSubmissions;

  return { draftLike, pending, published, atCreateLimit, atSubmitLimit };
}

describe("vendor dashboard quota", () => {
  const baseProducts: VendorDashboardProducts = {
    total: 4,
    draft: 1,
    pending_review: 1,
    published: 1,
    rejected: 1,
    archived: 0,
  };

  it("flags submit limit when pending meets cap", () => {
    const result = buildQuota(
      { maxActiveProducts: 3, maxPendingSubmissions: 1, quotaMode: "fixed" },
      baseProducts
    );
    expect(result.atSubmitLimit).toBe(true);
  });

  it("flags create limit when total quota slots are full", () => {
    const result = buildQuota(
      { maxActiveProducts: 2, maxPendingSubmissions: 2, quotaMode: "fixed" },
      baseProducts
    );
    expect(result.atCreateLimit).toBe(true);
  });

  it("never flags create limit in unlimited mode", () => {
    const result = buildQuota(
      { maxActiveProducts: 1, maxPendingSubmissions: 1, quotaMode: "unlimited" },
      baseProducts
    );
    expect(result.atCreateLimit).toBe(false);
  });
});
