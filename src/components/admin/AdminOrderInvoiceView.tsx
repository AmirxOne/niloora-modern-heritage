"use client";

import Image from "next/image";
import { useMemo } from "react";
import {
  buildAdminOrderInvoice,
  type AdminOrderInvoiceBreakdown,
} from "@/lib/orders/order-receipt";
import type { AdminOrder } from "@/lib/types";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";

function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusLabels: Record<AdminOrder["status"], string> = {
  pending_payment: fa.dashboard.orderStatus.pending_payment,
  payment_failed: fa.dashboard.orderStatus.payment_failed,
  processing: fa.dashboard.orderStatus.processing,
  crafting: fa.dashboard.orderStatus.crafting,
  shipped: fa.dashboard.orderStatus.shipped,
  delivered: fa.dashboard.orderStatus.delivered,
};

function DiscountRow({ label, amount }: { label: string; amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="order-receipt-totals-row order-receipt-totals-row--discount">
      <span>{label}</span>
      <span className="inline-flex items-baseline gap-x-0.5">
        <span aria-hidden>−</span>
        <TomanPrice amount={amount} size="xs" />
      </span>
    </div>
  );
}

function InvoiceTotals({
  invoice,
  order,
}: {
  invoice: AdminOrderInvoiceBreakdown;
  order: AdminOrder;
}) {
  const productDiscount = Math.max(0, invoice.listSubtotal - invoice.itemsSubtotal);
  const bundleTotal =
    invoice.appliedBundles.length > 0
      ? invoice.appliedBundles.reduce((sum, b) => sum + b.amount, 0)
      : invoice.bundleDiscount;
  const checkoutDiscount = Math.max(
    0,
    invoice.discountTotal -
      productDiscount -
      bundleTotal -
      invoice.campaignDiscountAmount -
      invoice.loyaltyDiscountAmount
  );

  return (
    <div className="order-receipt-totals">
      {invoice.listSubtotal > invoice.itemsSubtotal ? (
        <div className="order-receipt-totals-row">
          <span>{fa.receipt.listSubtotal}</span>
          <TomanPrice amount={invoice.listSubtotal} size="xs" variant="list" />
        </div>
      ) : null}

      <DiscountRow label={fa.admin.invoice.productDiscount} amount={productDiscount} />

      {invoice.appliedBundles.map((bundle) => (
        <DiscountRow
          key={bundle.id}
          label={`${fa.admin.invoice.bundleLabel}: ${bundle.title}`}
          amount={bundle.amount}
        />
      ))}

      {invoice.appliedBundles.length === 0 ? (
        <DiscountRow label={fa.admin.invoice.bundleLabel} amount={invoice.bundleDiscount} />
      ) : null}

      <DiscountRow
        label={
          invoice.promoCode
            ? `${fa.admin.invoice.checkoutDiscount} (${invoice.promoCode})`
            : fa.admin.invoice.checkoutDiscount
        }
        amount={checkoutDiscount}
      />

      <DiscountRow
        label={
          invoice.campaignTitle
            ? `${fa.admin.invoice.campaignLabel}: ${invoice.campaignTitle}`
            : fa.admin.invoice.campaignLabel
        }
        amount={invoice.campaignDiscountAmount}
      />

      {invoice.promoCode ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.receipt.promoCode}</span>
          <span className="font-mono text-sm" dir="ltr">
            {invoice.promoCode}
          </span>
        </div>
      ) : null}

      <DiscountRow label={fa.admin.invoice.loyaltyLabel} amount={invoice.loyaltyDiscountAmount} />

      {invoice.giftCardAppliedAmount > 0 ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.admin.invoice.giftCardLabel}</span>
          <span>
            {invoice.giftCardCode ? (
              <span className="font-mono" dir="ltr">
                {invoice.giftCardCode}
              </span>
            ) : null}
            {" · "}
            <span className="inline-flex items-baseline gap-x-0.5">
              <span aria-hidden>−</span>
              <TomanPrice amount={invoice.giftCardAppliedAmount} size="xs" />
            </span>
          </span>
        </div>
      ) : null}

      <div className="order-receipt-totals-row">
        <span>{fa.receipt.itemsSubtotal}</span>
        <TomanPrice amount={invoice.itemsSubtotal} size="xs" />
      </div>

      <div className="order-receipt-totals-row">
        <span>
          {fa.receipt.shipping}
          {invoice.shippingMethodLabel ? ` (${invoice.shippingMethodLabel})` : ""}
        </span>
        <span>
          {invoice.shippingCost > 0 ? (
            <TomanPrice amount={invoice.shippingCost} size="xs" />
          ) : (
            fa.dashboard.orderShippingCostFree
          )}
        </span>
      </div>

      {order.paymentMethod === "bnpl" && order.installmentMonths && order.installmentAmount ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.admin.invoice.installmentPlan}</span>
          <span>
            {order.installmentMonths.toLocaleString("fa-IR")} {fa.admin.invoice.installmentUnit} ×{" "}
            <TomanPrice amount={order.installmentAmount} size="xs" />
          </span>
        </div>
      ) : null}

      <div className="order-receipt-totals-row order-receipt-totals-row--paid">
        <span>{fa.receipt.paidTotal}</span>
        <TomanPrice amount={invoice.paidTotal} size="sm" />
      </div>

      {invoice.loyaltyPointsEarned > 0 ? (
        <div className="order-receipt-totals-row order-receipt-totals-row--muted">
          <span>{fa.admin.invoice.loyaltyPoints}</span>
          <span>{invoice.loyaltyPointsEarned.toLocaleString("fa-IR")}</span>
        </div>
      ) : null}
    </div>
  );
}

export function AdminOrderInvoiceView({ order }: { order: AdminOrder }) {
  const invoice = buildAdminOrderInvoice(order);
  const qrUrl = useMemo(() => {
    const payload = order.id;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&margin=8&data=${encodeURIComponent(payload)}`;
  }, [order.id]);

  return (
    <article className="order-receipt admin-order-invoice" id="admin-order-invoice-print">
      <header className="order-receipt-header admin-order-invoice-header">
        <div>
          <p className="page-eyebrow">{fa.admin.invoice.eyebrow}</p>
          <h1 className="order-receipt-title">{fa.admin.invoice.title}</h1>
          <p className="order-receipt-brand">{fa.brand.name}</p>
          <p className="order-receipt-tagline">{fa.brand.tagline}</p>
        </div>
        <div className="admin-order-invoice-qr-block">
          <div className="admin-order-invoice-qr-wrap">
            <Image
              src={qrUrl}
              alt={fa.admin.invoice.qrAlt(order.id)}
              width={120}
              height={120}
              className="admin-order-invoice-qr"
              unoptimized
            />
          </div>
          <p className="admin-order-invoice-code-label">{fa.admin.invoice.orderCode}</p>
          <p className="admin-order-invoice-code font-mono" dir="ltr">
            {order.id}
          </p>
        </div>
      </header>

      <section className="order-receipt-section admin-order-invoice-meta-grid">
        <div>
          <h2 className="order-receipt-section-title">{fa.admin.invoice.orderMeta}</h2>
          <div className="order-receipt-meta">
            <p>
              <span className="text-silver">{fa.receipt.orderId}: </span>
              <span className="font-mono text-ivory" dir="ltr">
                {invoice.orderId}
              </span>
            </p>
            <p>
              <span className="text-silver">{fa.receipt.date}: </span>
              <span>{formatReceiptDate(invoice.date)}</span>
            </p>
            <p>
              <span className="text-silver">{fa.admin.invoice.status}: </span>
              <span>{statusLabels[invoice.orderStatus]}</span>
            </p>
            {invoice.trackingCode ? (
              <p>
                <span className="text-silver">{fa.admin.orders.trackingLabel}: </span>
                <span className="font-mono" dir="ltr">
                  {invoice.trackingCode}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <h2 className="order-receipt-section-title">{fa.admin.invoice.customer}</h2>
          <div className="order-receipt-meta">
            <p>
              <span className="text-silver">{fa.admin.invoice.customerName}: </span>
              <span>{invoice.customer.name}</span>
            </p>
            <p>
              <span className="text-silver">{fa.admin.invoice.customerPhone}: </span>
              <span dir="ltr">{invoice.customer.phone}</span>
            </p>
            {invoice.customer.email ? (
              <p>
                <span className="text-silver">{fa.admin.invoice.customerEmail}: </span>
                <span dir="ltr">{invoice.customer.email}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="order-receipt-section">
        <h2 className="order-receipt-section-title">{fa.admin.invoice.payment}</h2>
        <div className="admin-order-invoice-kv">
          <p>
            <span>{fa.admin.invoice.paymentStatus}: </span>
            <strong>{invoice.paymentStatus ?? fa.admin.invoice.paymentPending}</strong>
          </p>
          {invoice.paymentGateway ? (
            <p>
              <span>{fa.admin.invoice.paymentGateway}: </span>
              <strong dir="ltr">{invoice.paymentGateway}</strong>
            </p>
          ) : null}
          {invoice.paymentMethod ? (
            <p>
              <span>{fa.admin.invoice.paymentMethod}: </span>
              <strong>
                {invoice.paymentMethod === "bnpl"
                  ? fa.admin.invoice.paymentBnpl
                  : fa.admin.invoice.paymentOnline}
              </strong>
            </p>
          ) : null}
          {invoice.paymentRefId ? (
            <p>
              <span>{fa.receipt.paymentRef}: </span>
              <strong className="font-mono" dir="ltr">
                {invoice.paymentRefId}
              </strong>
            </p>
          ) : null}
          {invoice.paymentVerifiedAt ? (
            <p>
              <span>{fa.admin.invoice.paymentVerified}: </span>
              <strong>{formatReceiptDate(invoice.paymentVerifiedAt)}</strong>
            </p>
          ) : null}
          <p>
            <span>{fa.admin.invoice.orderTotal}: </span>
            <strong>{formatPrice(invoice.paidTotal)}</strong>
          </p>
        </div>
      </section>

      <section className="order-receipt-section">
        <h2 className="order-receipt-section-title">{fa.receipt.itemsTitle}</h2>
        <table className="order-receipt-table">
          <thead>
            <tr>
              <th scope="col">{fa.receipt.colItem}</th>
              <th scope="col">{fa.admin.invoice.colSku}</th>
              <th scope="col">{fa.receipt.colQty}</th>
              <th scope="col">{fa.receipt.colUnit}</th>
              <th scope="col">{fa.receipt.colLine}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => {
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
                    </div>
                  </td>
                  <td className="font-mono text-xs" dir="ltr">
                    {item?.productId ?? "—"}
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
            {order.shipping.fullName} · <span dir="ltr">{order.shipping.mobile}</span>
            <br />
            {order.shipping.province}، {order.shipping.city} —{" "}
            <span dir="ltr">{order.shipping.postalCode}</span>
            <br />
            {order.shipping.address}
          </p>
          {invoice.orderNote?.trim() ? (
            <p className="mt-3 text-sm text-silver">
              <span>{fa.admin.invoice.orderNote}: </span>
              {invoice.orderNote}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="order-receipt-section">
        <InvoiceTotals invoice={invoice} order={order} />
      </section>

      <footer className="order-receipt-footer">
        <p>{fa.admin.invoice.footer}</p>
        <p className="text-xs text-silver">{fa.admin.invoice.footerNote}</p>
      </footer>
    </article>
  );
}
