"use client";

import Image from "next/image";
import { buildOrderReceipt, type OrderReceiptBreakdown } from "@/lib/orders/order-receipt";
import type { Order } from "@/lib/types";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import { summarizeRingCustomization } from "@/lib/orders/ring-customization-view";

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

function ReceiptTotals({ receipt, order }: { receipt: OrderReceiptBreakdown; order: Order }) {
  return (
    <div className="order-receipt-totals">
      {receipt.listSubtotal > receipt.itemsSubtotal ? (
        <div className="order-receipt-totals-row">
          <span>{fa.receipt.listSubtotal}</span>
          <TomanPrice amount={receipt.listSubtotal} size="xs" variant="list" />
        </div>
      ) : null}

      {receipt.discountTotal > 0 ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--discount">
          <span>{fa.receipt.discount}</span>
          <span className="inline-flex items-baseline gap-x-0.5">
            <span aria-hidden>−</span>
            <TomanPrice amount={receipt.discountTotal} size="xs" />
          </span>
        </div>
      ) : null}

      {receipt.promoCode ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.receipt.promoCode}</span>
          <span className="font-mono text-sm">{receipt.promoCode}</span>
        </div>
      ) : null}
      {order.paymentMethod === "bnpl" &&
      order.installmentMonths &&
      order.installmentAmount ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>برنامه اقساط</span>
          <span>
            {order.installmentMonths.toLocaleString("fa-IR")} قسط ×{" "}
            <TomanPrice amount={order.installmentAmount} size="xs" />
          </span>
        </div>
      ) : null}

      <div className="order-receipt-totals-row">
        <span>{fa.receipt.itemsSubtotal}</span>
        <TomanPrice amount={receipt.itemsSubtotal} size="xs" />
      </div>

      <div className="order-receipt-totals-row">
        <span>
          {fa.receipt.shipping}
          {receipt.shippingMethodLabel ? ` (${receipt.shippingMethodLabel})` : ""}
        </span>
        <span>
          {receipt.shippingCost > 0 ? (
            <TomanPrice amount={receipt.shippingCost} size="xs" />
          ) : (
            fa.dashboard.orderShippingCostFree
          )}
        </span>
      </div>

      <div className="order-receipt-totals-row order-receipt-totals-row--paid">
        <span>{fa.receipt.paidTotal}</span>
        <TomanPrice amount={receipt.paidTotal} size="sm" />
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
          <p className="page-eyebrow">{fa.receipt.eyebrow}</p>
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
            {receipt.lines.map((line) => {
              const item = order.items.find((i) => i.id === line.id);
              return (
              <tr key={line.id}>
                <td>
                  <div className="order-receipt-line-item">
                    {item?.image ? (
                      <div className="order-receipt-line-thumb">
                        <Image
                          src={item.image}
                          alt={line.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : null}
                    <span>{line.name}</span>
                    <div className="text-[11px] text-silver">
                      {(item ? summarizeRingCustomization(item) : []).map(
                        (detail) => (
                          <p key={detail}>{detail}</p>
                        )
                      )}
                    </div>
                  </div>
                </td>
                <td>{line.quantity.toLocaleString("fa-IR")}</td>
                <td>
                  {line.listPrice && line.listPrice > line.unitPrice ? (
                    <span className="order-receipt-unit-prices">
                      <TomanPrice amount={line.listPrice} size="xs" variant="list" />
                      <TomanPrice amount={line.unitPrice} size="xs" />
                    </span>
                  ) : (
                    <TomanPrice amount={line.unitPrice} size="xs" />
                  )}
                </td>
                <td>
                  <TomanPrice amount={line.lineTotal} size="xs" />
                </td>
              </tr>
              );
            })}
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
        <ReceiptTotals receipt={receipt} order={order} />
        {order.estimatedReadyDays ? (
          <p className="mt-3 text-xs text-silver">
            زمان آماده‌سازی تقریبی: {order.estimatedReadyDays.toLocaleString("fa-IR")} روز
          </p>
        ) : null}
      </section>

      <footer className="order-receipt-footer">
        <p>{fa.receipt.footerThanks}</p>
        <p className="text-xs text-silver">{fa.receipt.footerNote}</p>
      </footer>
    </article>
  );
}
