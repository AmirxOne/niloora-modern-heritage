import type { AdminOrder, Order } from "@/lib/types";

export type OrderReceiptLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  listPrice?: number;
  lineTotal: number;
};

export type OrderReceiptBreakdown = {
  order: Order;
  orderId: string;
  date: string;
  status: Order["status"];
  lines: OrderReceiptLine[];
  listSubtotal: number;
  discountTotal: number;
  itemsSubtotal: number;
  shippingCost: number;
  shippingMethodLabel?: string;
  promoCode?: string | null;
  paidTotal: number;
  paymentRefId?: string;
  paymentVerifiedAt?: string;
  paymentGateway?: string;
};

export const RECEIPT_ELIGIBLE_STATUSES: Order["status"][] = [
  "processing",
  "crafting",
  "shipped",
  "delivered",
];

export function orderHasReceipt(order: Pick<Order, "status">): boolean {
  return RECEIPT_ELIGIBLE_STATUSES.includes(order.status);
}

export function orderReceiptPath(orderId: string): string {
  return `/account/orders/${encodeURIComponent(orderId)}/receipt`;
}

export function adminOrderInvoicePath(orderId: string): string {
  return `/admin/orders/${encodeURIComponent(orderId)}/invoice`;
}

export type AdminOrderInvoiceBreakdown = OrderReceiptBreakdown & {
  customer: AdminOrder["customer"];
  orderStatus: Order["status"];
  trackingCode?: string;
  orderNote?: string;
  paymentStatus?: string;
  paymentGateway?: string;
  bundleDiscount: number;
  appliedBundles: NonNullable<Order["appliedBundles"]>;
  giftCardCode?: string | null;
  giftCardAppliedAmount: number;
  loyaltyTier?: Order["loyaltyTier"];
  loyaltyDiscountAmount: number;
  loyaltyPointsEarned: number;
  campaignTitle?: string;
  campaignDiscountAmount: number;
  paymentMethod?: Order["paymentMethod"];
  installmentMonths?: number;
  installmentAmount?: number;
};

export function buildOrderReceipt(order: Order): OrderReceiptBreakdown {
  const lines: OrderReceiptLine[] = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    listPrice: item.listPrice,
    lineTotal: item.price * item.quantity,
  }));

  const itemsSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingCost = order.shipping?.cost ?? 0;
  const discountTotal = order.totalFurooh ?? 0;
  const listSubtotal = order.subtotalList ?? itemsSubtotal + discountTotal;

  return {
    order,
    orderId: order.id,
    date: order.date,
    status: order.status,
    lines,
    listSubtotal,
    discountTotal,
    itemsSubtotal,
    shippingCost,
    shippingMethodLabel: order.shipping?.methodLabel,
    promoCode: order.promoCode,
    paidTotal: order.total,
    paymentRefId: order.payment?.refId,
    paymentVerifiedAt: order.payment?.verifiedAt,
    paymentGateway: order.payment?.gateway,
  };
}

export function buildAdminOrderInvoice(order: AdminOrder): AdminOrderInvoiceBreakdown {
  const base = buildOrderReceipt(order);
  return {
    ...base,
    customer: order.customer,
    orderStatus: order.status,
    trackingCode: order.trackingCode,
    orderNote: order.shipping?.orderNote,
    paymentStatus: order.payment?.status,
    paymentGateway: order.payment?.gateway,
    bundleDiscount: order.bundleDiscount ?? 0,
    appliedBundles: order.appliedBundles ?? [],
    giftCardCode: order.giftCardCode,
    giftCardAppliedAmount: order.giftCardAppliedAmount ?? 0,
    loyaltyTier: order.loyaltyTier,
    loyaltyDiscountAmount: order.loyaltyDiscountAmount ?? 0,
    loyaltyPointsEarned: order.loyaltyPointsEarned ?? 0,
    campaignTitle: order.campaignTitle,
    campaignDiscountAmount: order.campaignDiscountAmount ?? 0,
    paymentMethod: order.paymentMethod,
    installmentMonths: order.installmentMonths,
    installmentAmount: order.installmentAmount,
  };
}
