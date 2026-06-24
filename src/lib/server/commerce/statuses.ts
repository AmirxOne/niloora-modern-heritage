import type { ProductAvailability } from "@/lib/types";

/** Canonical order lifecycle statuses (stored as strings in DB). */
export const ORDER_STATUS = {
  pendingPayment: "pending_payment",
  paymentFailed: "payment_failed",
  processing: "processing",
  crafting: "crafting",
  shipped: "shipped",
  delivered: "delivered",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  ORDER_STATUS.pendingPayment,
  ORDER_STATUS.paymentFailed,
  ORDER_STATUS.processing,
  ORDER_STATUS.crafting,
  ORDER_STATUS.shipped,
  ORDER_STATUS.delivered,
];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value);
}

/** Payment gateway row statuses. */
export const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_VALUES: readonly PaymentStatus[] = [
  PAYMENT_STATUS.pending,
  PAYMENT_STATUS.paid,
  PAYMENT_STATUS.failed,
];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUS_VALUES as readonly string[]).includes(value);
}

/** Product purchasability / fulfillment (not publication). */
export const PRODUCT_AVAILABILITY = {
  ready: "ready",
  preorder: "preorder",
  sold: "sold",
  luxury: "luxury",
  madeToOrder: "made-to-order",
} as const satisfies Record<string, ProductAvailability>;

export const PRODUCT_AVAILABILITY_VALUES: readonly ProductAvailability[] = [
  PRODUCT_AVAILABILITY.ready,
  PRODUCT_AVAILABILITY.preorder,
  PRODUCT_AVAILABILITY.sold,
  PRODUCT_AVAILABILITY.luxury,
  PRODUCT_AVAILABILITY.madeToOrder,
];

export function isProductAvailability(value: string): value is ProductAvailability {
  return (PRODUCT_AVAILABILITY_VALUES as readonly string[]).includes(value as ProductAvailability);
}

/** InventoryLog.reason values used by commerce flows. */
export const INVENTORY_LOG_REASON = {
  orderPaid: "order_paid",
  returnApproved: "return_approved",
} as const;
