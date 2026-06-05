import { buildOrderTimeline } from "@/lib/orders/order-timeline";
import type { Order } from "@/lib/types";

function makeOrder(partial: Partial<Order>): Order {
  return {
    id: "HS-TEST",
    date: "2026-01-01T10:00:00.000Z",
    status: "processing",
    total: 1_000_000,
    items: [],
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...partial,
  };
}

describe("Orders — timeline", () => {
  it("marks production step current for processing orders", () => {
    const steps = buildOrderTimeline(makeOrder({ status: "processing" }));
    const production = steps.find((step) => step.id === "production");
    expect(production?.state).toBe("current");
    expect(steps[0]?.state).toBe("completed");
  });

  it("shows failed state for payment_failed", () => {
    const steps = buildOrderTimeline(makeOrder({ status: "payment_failed" }));
    expect(steps.some((s) => s.state === "failed")).toBe(true);
  });

  it("includes BNPL orders in active timeline", () => {
    const steps = buildOrderTimeline(
      makeOrder({ status: "processing", paymentMethod: "bnpl", installmentMonths: 6 })
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]?.state).not.toBe("failed");
  });
});
