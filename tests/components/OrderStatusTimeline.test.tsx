import { render, screen } from "@testing-library/react";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { fa } from "@/lib/i18n/fa";
import type { Order } from "@/lib/types";

const baseOrder: Order = {
  id: "HS-UI-TEST",
  date: "2026-02-01T08:00:00.000Z",
  status: "shipped",
  total: 2_500_000,
  items: [],
  updatedAt: "2026-02-03T12:00:00.000Z",
  trackingCode: "POST-1234",
};

describe("OrderStatusTimeline", () => {
  it("renders timeline section with accessible label", () => {
    render(<OrderStatusTimeline order={baseOrder} />);
    expect(
      screen.getByRole("region", { name: fa.dashboard.orderTimeline.title })
    ).toBeInTheDocument();
  });

  it("lists at least one timeline step", () => {
    render(<OrderStatusTimeline order={baseOrder} />);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
