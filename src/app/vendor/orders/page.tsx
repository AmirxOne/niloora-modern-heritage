"use client";

import { useEffect, useMemo, useState } from "react";
import { VendorCard, VendorPageHeader, useVendorProfile } from "@/components/vendor/VendorShell";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";

type VendorOrderLine = {
  orderItemId: string;
  orderId: string;
  orderStatus: string;
  name: string;
  quantity: number;
  price: number;
  orderDate: string;
  shippingName?: string;
};

type GroupedOrder = {
  orderId: string;
  orderStatus: string;
  orderDate: string;
  shippingName?: string;
  lines: VendorOrderLine[];
  lineTotal: number;
};

function groupOrders(lines: VendorOrderLine[]): GroupedOrder[] {
  const map = new Map<string, GroupedOrder>();
  for (const line of lines) {
    const existing = map.get(line.orderId);
    const lineTotal = line.price * line.quantity;
    if (existing) {
      existing.lines.push(line);
      existing.lineTotal += lineTotal;
    } else {
      map.set(line.orderId, {
        orderId: line.orderId,
        orderStatus: line.orderStatus,
        orderDate: line.orderDate,
        shippingName: line.shippingName,
        lines: [line],
        lineTotal,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}

export default function VendorOrdersPage() {
  const { vendor, loading: profileLoading } = useVendorProfile();
  const [lines, setLines] = useState<VendorOrderLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor?.status !== "active") {
      setLoading(false);
      return;
    }
    fetch("/api/vendor/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLines(data.orders ?? []))
      .finally(() => setLoading(false));
  }, [vendor]);

  const grouped = useMemo(() => groupOrders(lines), [lines]);

  if (profileLoading || loading) {
    return <LoadingState variant="vendor-orders" className="py-2" label={fa.vendor.loading} />;
  }

  if (!vendor || vendor.status !== "active") {
    return (
      <section>
        <VendorPageHeader title={fa.vendor.ordersTitle} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.vendorInactive}</p>
        </VendorCard>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader title={fa.vendor.ordersTitle} />

      {grouped.length === 0 ? (
        <p className="text-silver">{fa.vendor.ordersEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {grouped.map((order) => (
            <li key={order.orderId}>
              <VendorCard>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-subtle pb-3">
                  <div>
                    <div className="text-sm text-silver">{fa.vendor.ordersOrderId}</div>
                    <div className="font-medium text-ivory" dir="ltr">
                      {order.orderId}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-silver">{fa.vendor.ordersDate}</div>
                    <div className="text-sm text-ivory">
                      {new Date(order.orderDate).toLocaleDateString("fa-IR")}
                    </div>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-silver">{fa.vendor.ordersStatus}</dt>
                    <dd className="text-ivory">{order.orderStatus}</dd>
                  </div>
                  {order.shippingName ? (
                    <div>
                      <dt className="text-silver">{fa.vendor.ordersCustomer}</dt>
                      <dd className="text-ivory">{order.shippingName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-silver">{fa.vendor.ordersLineTotal}</dt>
                    <dd className="font-medium text-ivory">{formatPrice(order.lineTotal)}</dd>
                  </div>
                </dl>
                <ul className="mt-4 space-y-2 border-t border-subtle pt-3">
                  {order.lines.map((line) => (
                    <li
                      key={line.orderItemId}
                      className="flex justify-between gap-4 text-sm text-silver"
                    >
                      <span>
                        {line.name} × {line.quantity}
                      </span>
                      <span>{formatPrice(line.price * line.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </VendorCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
