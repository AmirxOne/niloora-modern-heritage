import { render, screen } from "@testing-library/react";
import { ProductAvailabilityBadge } from "@/components/product/ProductAvailabilityBadge";
import { getProductStatusConfig } from "@/lib/product-status";

describe("ProductAvailabilityBadge", () => {
  it("renders ready availability label", () => {
    const config = getProductStatusConfig("ready");
    render(<ProductAvailabilityBadge availability="ready" />);
    expect(screen.getByText(config.label)).toBeInTheDocument();
  });

  it("renders short sold label when short prop is set", () => {
    const config = getProductStatusConfig("sold");
    render(<ProductAvailabilityBadge availability="sold" short />);
    expect(screen.getByText(config.shortLabel)).toBeInTheDocument();
  });

  it("shows delivery hint when showDelivery is enabled", () => {
    const config = getProductStatusConfig("preorder");
    render(<ProductAvailabilityBadge availability="preorder" showDelivery />);
    expect(screen.getByText(config.deliveryHint)).toBeInTheDocument();
  });
});
