import type { Order } from "@/lib/types";

export type OrderReceiptLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  listPrice?: number;
  lineTotal: number;
};

export type OrderReceiptBreakdown = {
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
