import { describe, expect, it } from "vitest";
import {
  isOrderStatus,
  isPaymentStatus,
  isProductAvailability,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_AVAILABILITY,
} from "@/lib/server/commerce/statuses";

describe("commerce statuses", () => {
  it("validates order statuses", () => {
    expect(isOrderStatus(ORDER_STATUS.processing)).toBe(true);
    expect(isOrderStatus("invalid")).toBe(false);
  });

  it("validates payment statuses", () => {
    expect(isPaymentStatus(PAYMENT_STATUS.paid)).toBe(true);
    expect(isPaymentStatus("pending")).toBe(true);
  });

  it("validates product availability values", () => {
    expect(isProductAvailability(PRODUCT_AVAILABILITY.sold)).toBe(true);
    expect(isProductAvailability("Sold")).toBe(false);
  });
});
