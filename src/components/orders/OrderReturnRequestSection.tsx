"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox, SelectBox } from "@/components/inputs";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { Badge } from "@/components/ui/Badge";
import { useOrderReturns } from "@/lib/hooks/useOrderReturns";
import { ORDER_RETURN_REASONS } from "@/lib/returns/constants";
import { OPEN_ORDER_RETURN_STATUSES, unifiedReturnStatusBadgeVariant } from "@/lib/returns/workflow";
import type { CustomerOrderReturn, Order } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";

const t = fa.orderReturns;

type SelectedItem = { orderItemId: string; quantity: number; maxQuantity: number; name: string; unitPrice: number };

function parseTomanInput(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^\d]/g, "");
  return Number.parseInt(normalized, 10) || 0;
}

function ReturnStatusCard({ row }: { row: CustomerOrderReturn }) {
  return (
    <article className="order-return-status-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs text-silver" dir="ltr">
          {row.id}
        </p>
        <Badge variant={unifiedReturnStatusBadgeVariant(row.unifiedStatus)}>
          {t.unifiedStatus[row.unifiedStatus]}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-silver">
        {t.reason[row.reason as keyof typeof t.reason] ?? row.reason}
      </p>
      <p className="mt-1 text-sm">
        <TomanPrice amount={row.refundableAmount} size="xs" />
      </p>
      <ul className="mt-2 space-y-1 text-xs text-silver">
        {row.items.map((item) => (
          <li key={item.orderItemId}>
            {item.name} × {item.quantity.toLocaleString("fa-IR")}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function OrderReturnRequestSection({ order }: { order: Order }) {
  const returnsApi = useOrderReturns(order.id);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<string>(ORDER_RETURN_REASONS[0]);
  const [reasonDetail, setReasonDetail] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [successIds, setSuccessIds] = useState<{ returnId: string; supportId: string } | null>(
    null
  );

  useEffect(() => {
    void returnsApi.load();
  }, [returnsApi]);

  const lineItems: SelectedItem[] = useMemo(
    () =>
      order.items.map((item) => ({
        orderItemId: item.id,
        quantity: selected[item.id] ?? 0,
        maxQuantity: item.quantity,
        name: item.name,
        unitPrice: item.price,
      })),
    [order.items, selected]
  );

  const suggestedAmount = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + (item.quantity > 0 ? item.unitPrice * item.quantity : 0),
        0
      ),
    [lineItems]
  );

  const hasOpenReturn = returnsApi.returns.some((row) =>
    OPEN_ORDER_RETURN_STATUSES.includes(row.status)
  );

  const reasonOptions = ORDER_RETURN_REASONS.map((value) => ({
    value,
    label: t.reason[value],
  }));

  function toggleItem(orderItemId: string, maxQuantity: number) {
    setSelected((prev) => {
      const current = prev[orderItemId] ?? 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[orderItemId];
        return next;
      }
      return { ...prev, [orderItemId]: maxQuantity };
    });
  }

  function setItemQuantity(orderItemId: string, maxQuantity: number, quantity: number) {
    const safe = Math.max(0, Math.min(maxQuantity, quantity));
    setSelected((prev) => {
      if (safe <= 0) {
        const next = { ...prev };
        delete next[orderItemId];
        return next;
      }
      return { ...prev, [orderItemId]: safe };
    });
  }

  useEffect(() => {
    if (suggestedAmount > 0 && !amountInput) {
      setAmountInput(suggestedAmount.toLocaleString("fa-IR"));
    }
  }, [suggestedAmount, amountInput]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const items = lineItems
      .filter((item) => item.quantity > 0)
      .map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity }));
    if (!items.length) {
      toast.error(t.toast.selectItems);
      return;
    }

    const result = await returnsApi.submit({
      orderId: order.id,
      reason,
      reasonDetail: reasonDetail.trim() || undefined,
      refundableAmount: parseTomanInput(amountInput) || suggestedAmount,
      items,
      message: extraMessage.trim() || undefined,
    });

    if (result?.return && result.supportRequestId) {
      setSuccessIds({ returnId: result.return.id, supportId: result.supportRequestId });
      setSelected({});
      setReasonDetail("");
      setExtraMessage("");
    }
  }

  return (
    <section id="return" className="order-return-section">
      <div className="order-return-section-head">
        <h2 className="order-return-section-title">{t.sectionTitle}</h2>
        <p className="order-return-section-hint">{t.sectionHint}</p>
      </div>

      {successIds ? (
        <StatusAlert tone="success" title={t.successTitle} className="mb-4">
          <p>{t.successBody}</p>
          <p className="mt-2 text-sm">{t.trackingIds(successIds.returnId, successIds.supportId)}</p>
        </StatusAlert>
      ) : null}

      {returnsApi.returns.length > 0 ? (
        <div className="order-return-existing">
          <h3 className="text-sm font-medium text-ivory">{t.existingTitle}</h3>
          <div className="mt-3 space-y-3">
            {returnsApi.returns.map((row) => (
              <ReturnStatusCard key={row.id} row={row} />
            ))}
          </div>
        </div>
      ) : null}

      {hasOpenReturn ? (
        <StatusAlert tone="info" className="mt-4">
          <p>{t.openReturnBlocked}</p>
        </StatusAlert>
      ) : (
        <form className="order-return-form" onSubmit={handleSubmit}>
          <div>
            <p className="mb-2 text-sm font-medium text-ivory">{t.itemsLabel}</p>
            <ul className="order-return-items-list">
              {lineItems.map((item) => {
                const checked = item.quantity > 0;
                return (
                  <li key={item.orderItemId} className="order-return-item-row">
                    <label className="order-return-item-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.orderItemId, item.maxQuantity)}
                      />
                      <span>{item.name}</span>
                    </label>
                    <div className="order-return-item-qty">
                      <TextBox
                        label="تعداد"
                        value={checked ? String(item.quantity) : ""}
                        onChange={(event) =>
                          setItemQuantity(
                            item.orderItemId,
                            item.maxQuantity,
                            Number.parseInt(event.target.value, 10) || 0
                          )
                        }
                        disabled={!checked}
                        inputMode="numeric"
                      />
                      <span className="text-xs text-silver">
                        از {item.maxQuantity.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <SelectBox label={t.reasonLabel} value={reason} options={reasonOptions} onValueChange={setReason} />
          <TextAreaBox
            label={t.reasonDetailLabel}
            value={reasonDetail}
            onChange={(event) => setReasonDetail(event.target.value)}
          />
          <TextBox
            label={t.refundableAmountLabel}
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            inputMode="numeric"
          />
          <p className="text-xs text-silver">{t.refundableAmountHint}</p>
          <TextAreaBox
            label={t.extraMessageLabel}
            value={extraMessage}
            onChange={(event) => setExtraMessage(event.target.value)}
          />

          <Button type="submit" className="w-full" disabled={returnsApi.isSubmitting}>
            {returnsApi.isSubmitting ? t.submitting : t.submit}
          </Button>
        </form>
      )}

      <p className="order-return-support-link">
        <Link href={`/support?orderId=${encodeURIComponent(order.id)}`} className="text-turquoise hover:underline">
          {t.generalSupportCta}
        </Link>
      </p>
    </section>
  );
}
