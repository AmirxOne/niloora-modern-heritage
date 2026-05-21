"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OrderReceiptView } from "@/components/orders/OrderReceiptView";
import { Button } from "@/components/ui/Button";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { orderHasReceipt } from "@/lib/orders/order-receipt";
import type { Order } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
interface OrderReceiptPageContentProps {
  orderId: string;
}

export function OrderReceiptPageContent({ orderId }: OrderReceiptPageContentProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      const data = (await response.json()) as { order?: Order; message?: string };
      if (!response.ok || !data.order) {
        setError(data.message ?? fa.receipt.loadError);
        setOrder(null);
        return;
      }
      if (!orderHasReceipt(data.order)) {
        setError(fa.receipt.notAvailable);
        setOrder(null);
        return;
      }
      setOrder(data.order);
    } catch {
      setError(fa.receipt.loadError);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  if (loading) {
    return (
      <div className="order-receipt-page-state" aria-busy="true">
        <p className="text-silver">{fa.receipt.loading}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-receipt-page-state">
        <p className="font-display text-xl text-ivory">{error ?? fa.receipt.loadError}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => void load()}>
            {fa.receipt.retry}
          </Button>
          <Link href="/account#orders">
            <Button>{fa.receipt.backToOrders}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-receipt-page">
      <header className="order-receipt-page-toolbar no-print">
        <div>
          <span className="heritage-eyebrow">{fa.receipt.eyebrow}</span>
          <h1 className="order-receipt-page-title">{fa.receipt.pageTitle}</h1>
        </div>
        <div className="order-receipt-page-actions">
          <Button variant="outline" onClick={handlePrint}>
            {fa.receipt.printPdf}
          </Button>
          <Link href="/account#orders">
            <Button variant="outline">{fa.receipt.backToOrders}</Button>
          </Link>
        </div>
      </header>

      <OrnamentalDivider className="order-receipt-page-divider no-print" />

      <OrderReceiptView order={order} />

      <p className="order-receipt-print-hint no-print">{fa.receipt.printHint}</p>
    </div>
  );
}
