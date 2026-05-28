"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminOrderInvoiceView } from "@/components/admin/AdminOrderInvoiceView";
import { Button } from "@/components/ui/Button";
import type { AdminOrder } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";

type Props = {
  orderId: string;
};

export function AdminOrderInvoicePageContent({ orderId }: Props) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`);
      const data = await parseJsonResponse<{ order?: AdminOrder; message?: string }>(response);
      if (!response.ok || !data?.order) {
        setError(data?.message ?? fa.admin.invoice.loadError);
        setOrder(null);
        return;
      }
      setOrder(data.order);
    } catch {
      setError(fa.admin.invoice.loadError);
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
      <div className="order-receipt-page-state">
        <LoadingState variant="receipt" label={fa.admin.invoice.loading} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-receipt-page-state">
        <p className="font-display text-xl text-ivory">{error ?? fa.admin.invoice.loadError}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => void load()}>
            {fa.receipt.retry}
          </Button>
          <Link href="/admin/orders">
            <Button>{fa.admin.invoice.backToOrders}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-receipt-page admin-order-invoice-page">
      <header className="order-receipt-page-toolbar no-print">
        <div>
          <span className="page-eyebrow">{fa.admin.invoice.eyebrow}</span>
          <h1 className="order-receipt-page-title">{fa.admin.invoice.pageTitle}</h1>
          <p className="mt-1 font-mono text-sm text-silver" dir="ltr">
            {order.id}
          </p>
        </div>
        <div className="order-receipt-page-actions">
          <Button type="button" onClick={handlePrint}>
            {fa.admin.invoice.printPdf}
          </Button>
          <Link href="/admin/orders">
            <Button variant="outline">{fa.admin.invoice.backToOrders}</Button>
          </Link>
        </div>
      </header>

      <AdminOrderInvoiceView order={order} />

      <p className="order-receipt-print-hint no-print">{fa.admin.invoice.printHint}</p>
    </div>
  );
}
