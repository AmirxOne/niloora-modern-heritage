"use client";

import Image from "next/image";
import { buildOrderReceipt, type OrderReceiptBreakdown } from "@/lib/orders/order-receipt";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";

interface OrderReceiptViewProps {
  order: Order;
}

function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReceiptTotals({ receipt }: { receipt: OrderReceiptBreakdown }) {
  return (
    <div className="order-receipt-totals">
      {receipt.listSubtotal > receipt.itemsSubtotal ? (
        <div className="order-receipt-totals-row">
          <span>{fa.receipt.listSubtotal}</span>
          <span className="text-silver line-through decoration-gold/30">
            {formatPrice(receipt.listSubtotal)}
          </span>
        </div>
      ) : null}

      {receipt.discountTotal > 0 ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--discount">
          <span>{fa.receipt.discount}</span>
          <span>−{formatPrice(receipt.discountTotal)}</span>
        </div>
      ) : null}

      {receipt.promoCode ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.receipt.promoCode}</span>
          <span className="font-mono text-sm">{receipt.promoCode}</span>
        </div>
      ) : null}

      <div className="order-receipt-totals-row">
        <span>{fa.receipt.itemsSubtotal}</span>
        <span>{formatPrice(receipt.itemsSubtotal)}</span>
      </div>

      <div className="order-receipt-totals-row">
        <span>
          {fa.receipt.shipping}
          {receipt.shippingMethodLabel ? ` (${receipt.shippingMethodLabel})` : ""}
        </span>
        <span>
          {receipt.shippingCost > 0
            ? formatPrice(receipt.shippingCost)
            : fa.dashboard.orderShippingCostFree}
        </span>
      </div>

      <div className="order-receipt-totals-row order-receipt-totals-row--paid">
        <span>{fa.receipt.paidTotal}</span>
        <span>{formatPrice(receipt.paidTotal)}</span>
      </div>
    </div>
  );
}

export function OrderReceiptView({ order }: OrderReceiptViewProps) {
  const receipt = buildOrderReceipt(order);

  return (
    <article className="order-receipt" id="order-receipt-print">
      <header className="order-receipt-header">
        <div>
          <p className="heritage-eyebrow">{fa.receipt.eyebrow}</p>
          <h1 className="order-receipt-title">{fa.receipt.title}</h1>
          <p className="order-receipt-brand">{fa.brand.name}</p>
          <p className="order-receipt-tagline">{fa.brand.tagline}</p>
        </div>
        <div className="order-receipt-meta">
          <p>
            <span className="text-silver">{fa.receipt.orderId}: </span>
            <span className="font-mono text-ivory">{receipt.orderId}</span>
          </p>
          <p>
            <span className="text-silver">{fa.receipt.date}: </span>
            <span>{formatReceiptDate(receipt.date)}</span>
          </p>
          {receipt.paymentRefId ? (
            <p>
              <span className="text-silver">{fa.receipt.paymentRef}: </span>
              <span className="font-mono" dir="ltr">
                {receipt.paymentRefId}
              </span>
            </p>
          ) : null}
        </div>
      </header>

      <OrnamentalDivider className="order-receipt-divider" />

      <section className="order-receipt-section">
        <h2 className="order-receipt-section-title">{fa.receipt.itemsTitle}</h2>
        <table className="order-receipt-table">
          <thead>
            <tr>
              <th scope="col">{fa.receipt.colItem}</th>
              <th scope="col">{fa.receipt.colQty}</th>
              <th scope="col">{fa.receipt.colUnit}</th>
              <th scope="col">{fa.receipt.colLine}</th>
            </tr>
          </thead>
          <tbody>
            {receipt.lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <div className="order-receipt-line-item">
                    {order.items.find((i) => i.id === line.id)?.image ? (
                      <div className="order-receipt-line-thumb">
                        <Image
                          src={order.items.find((i) => i.id === line.id)!.image}
                          alt={line.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : null}
                    <span>{line.name}</span>
                  </div>
                </td>
                <td>{line.quantity.toLocaleString("fa-IR")}</td>
                <td>
                  {line.listPrice && line.listPrice > line.unitPrice ? (
                    <span className="order-receipt-unit-prices">
                      <span className="text-silver line-through text-xs">
                        {formatPrice(line.listPrice)}
                      </span>
                      <span>{formatPrice(line.unitPrice)}</span>
                    </span>
                  ) : (
                    formatPrice(line.unitPrice)
                  )}
                </td>
                <td className="font-medium text-gold-dark">{formatPrice(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {order.shipping ? (
        <section className="order-receipt-section">
          <h2 className="order-receipt-section-title">{fa.receipt.shippingAddress}</h2>
          <p className="order-receipt-address">
            {order.shipping.fullName} · {order.shipping.mobile}
            <br />
            {order.shipping.province}، {order.shipping.city} — {order.shipping.postalCode}
            <br />
            {order.shipping.address}
          </p>
        </section>
      ) : null}

      <section className="order-receipt-section">
        <ReceiptTotals receipt={receipt} />
      </section>

      <footer className="order-receipt-footer">
        <p>{fa.receipt.footerThanks}</p>
        <p className="text-xs text-silver">{fa.receipt.footerNote}</p>
      </footer>
    </article>
  );
}
