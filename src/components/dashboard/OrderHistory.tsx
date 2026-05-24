"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { orderHasReceipt, orderReceiptPath } from "@/lib/orders/order-receipt";
import type { Order } from "@/lib/types";
import { TomanPrice, TomanPriceWithSuffix } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { ORDERS_PAGE_SIZE } from "@/lib/pagination";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

const statusLabels: Record<Order["status"], string> = {
  pending_payment: fa.dashboard.orderStatus.pending_payment,
  payment_failed: fa.dashboard.orderStatus.payment_failed,
  processing: fa.dashboard.orderStatus.processing,
  crafting: fa.dashboard.orderStatus.crafting,
  shipped: fa.dashboard.orderStatus.shipped,
  delivered: fa.dashboard.orderStatus.delivered,
};

const statusVariant: Record<Order["status"], "gold" | "turquoise" | "royal" | "default"> = {
  pending_payment: "gold",
  payment_failed: "default",
  processing: "royal",
  crafting: "turquoise",
  shipped: "gold",
  delivered: "default",
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      className="order-history-card"
    >
      <header className="order-history-card-header">
        <div>
          <p className="order-history-id">{order.id}</p>
          <p className="order-history-date">{formatOrderDate(order.date)}</p>
        </div>
        <Badge variant={statusVariant[order.status]}>{statusLabels[order.status]}</Badge>
      </header>

      <OrderStatusTimeline order={order} />

      {order.shipping ? (
        <div className="order-history-shipping">
          <p className="order-history-shipping-title">{fa.dashboard.orderShippingTitle}</p>
          <p className="order-history-shipping-line">
            {order.shipping.fullName} · {order.shipping.mobile}
          </p>
          <p className="order-history-shipping-line">
            {order.shipping.province}، {order.shipping.city} — {order.shipping.postalCode}
          </p>
          <p className="order-history-shipping-address">{order.shipping.address}</p>
          <div className="order-history-shipping-meta">
            <span>
              {fa.dashboard.orderShippingMethod}: {order.shipping.methodLabel}
            </span>
            <span>
              {fa.dashboard.orderShippingCost}:{" "}
              {order.shipping.cost > 0 ? (
                <TomanPrice amount={order.shipping.cost} size="xs" />
              ) : (
                fa.dashboard.orderShippingCostFree
              )}
            </span>
          </div>
          {order.shipping.orderNote ? (
            <p className="order-history-shipping-note">
              <span className="text-silver">{fa.dashboard.orderShippingNote}: </span>
              {order.shipping.orderNote}
            </p>
          ) : null}
          {order.trackingCode ? (
            <p className="order-history-tracking">
              <span className="text-silver">{fa.dashboard.orderTrackingCode}: </span>
              <span className="font-mono text-ivory" dir="ltr">
                {order.trackingCode}
              </span>
            </p>
          ) : order.status === "shipped" || order.status === "delivered" ? (
            <p className="order-history-tracking-pending text-silver">
              {fa.dashboard.orderTrackingPending}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="order-history-items">
        {order.items.map((item) => (
          <li key={item.id} className="order-history-line">
            <div className="order-history-thumb">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="72px" />
            </div>
            <div className="order-history-line-body">
              {item.productId ? (
                <Link href={`/product/${item.productId}`} className="order-history-item-name">
                  {item.name}
                </Link>
              ) : (
                <p className="order-history-item-name">{item.name}</p>
              )}
              <p className="order-history-item-meta">
                {fa.dashboard.orderItems(item.quantity)} · <TomanPrice amount={item.price} size="xs" />
              </p>
            </div>
            <p className="order-history-line-total">
              <TomanPrice amount={item.price * item.quantity} size="xs" />
            </p>
          </li>
        ))}
      </ul>

      <footer className="order-history-card-footer">
        <div>
          <span className="text-sm text-silver">
            {fa.dashboard.orderItems(itemCount)} · {fa.dashboard.orderTotal}
          </span>
          {order.totalFurooh != null && order.totalFurooh > 0 ? (
            <p className="mt-1 text-xs discount-text">
              <TomanPriceWithSuffix
                amount={order.totalFurooh}
                suffix={fa.dashboard.orderBahakahiSuffix}
                size="xs"
              />
            </p>
          ) : null}
          {order.paymentMethod === "bnpl" && order.installmentMonths && order.installmentAmount ? (
            <p className="mt-1 text-xs text-silver">
              خرید اقساطی: {order.installmentMonths.toLocaleString("fa-IR")} قسط ×{" "}
              <TomanPrice amount={order.installmentAmount} size="xs" />
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {orderHasReceipt(order) ? (
              <Link
                href={orderReceiptPath(order.id)}
                className="order-history-invoice-link"
              >
                {fa.dashboard.viewInvoice}
              </Link>
            ) : null}
            <Link
              href={`/support?orderId=${encodeURIComponent(order.id)}`}
              className="order-history-invoice-link"
            >
              {fa.dashboard.submitSupportRequest}
            </Link>
          </div>
        </div>
        <TomanPrice amount={order.total} size="md" />
      </footer>
    </motion.article>
  );
}

interface OrderHistoryProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrderHistory({ orders, isLoading = false }: OrderHistoryProps) {
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [orders]
  );

  const {
    paginatedItems: pagedOrders,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(sortedOrders, ORDERS_PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="order-history-list space-y-5" aria-busy="true" aria-live="polite">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article
            key={idx}
            className="order-history-card rounded-heritage-lg border border-[#F0EDE9] bg-white p-5"
          >
            <header className="order-history-card-header">
              <div>
                <div className="sk h-4 w-40" />
                <div className="sk mt-2 h-3 w-28" />
              </div>
              <div className="sk h-6 w-24 rounded-full" />
            </header>
            <div className="order-timeline order-timeline--skeleton border-b border-[#F0EDE9] px-5 py-4 md:px-6">
              <div className="sk h-3 w-36" />
              <div className="mt-4 space-y-4">
                {Array.from({ length: 5 }).map((_, stepIdx) => (
                  <div key={stepIdx} className="flex gap-3">
                    <div className="sk h-3 w-3 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="sk h-3 w-24" />
                      <div className="sk h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ul className="order-history-items">
              {Array.from({ length: 2 }).map((_, lineIdx) => (
                <li key={lineIdx} className="order-history-line">
                  <div className="sk order-history-thumb" />
                  <div className="order-history-line-body">
                    <div className="sk h-4 w-40" />
                    <div className="sk mt-2 h-3 w-24" />
                  </div>
                  <div className="sk h-4 w-20" />
                </li>
              ))}
            </ul>
            <footer className="order-history-card-footer">
              <div>
                <div className="sk h-3 w-36" />
                <div className="sk mt-2 h-3 w-28" />
              </div>
              <div className="sk h-5 w-24" />
            </footer>
          </article>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <UnifiedEmptyState
        visual="orders"
        title={fa.dashboard.noOrders}
        description={fa.dashboard.noOrdersHint}
        className="order-history-empty"
        action={
          <Link href="/shop">
            <Button variant="outline">{fa.dashboard.browseCollection}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="order-history-list">
        {pagedOrders.map((order, i) => (
          <OrderCard key={order.id} order={order} index={i} />
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        from={from}
        to={to}
        scrollTargetId="purchase-history"
        className="order-history-pagination"
      />
    </>
  );
}
