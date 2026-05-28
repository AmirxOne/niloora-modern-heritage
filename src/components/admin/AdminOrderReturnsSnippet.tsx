"use client";

import Link from "next/link";
import type { AdminOrderReturnSummary } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const t = fa.admin.returns;

const statusLabels = t.status as Record<string, string>;
const statusVariant: Record<string, "gold" | "turquoise" | "default" | "royal"> = {
  requested: "gold",
  under_review: "royal",
  approved: "turquoise",
  rejected: "default",
  refunded: "turquoise",
  cancelled: "default",
};

export function AdminOrderReturnsSnippet({ returns }: { returns: AdminOrderReturnSummary[] }) {
  if (!returns.length) {
    return (
      <p className="admin-order-returns-empty text-xs text-silver">{t.noReturnsOnOrder}</p>
    );
  }

  return (
    <div className="admin-order-returns">
      <p className="text-xs font-medium text-gold-dark">{t.relatedOnOrder}</p>
      <ul className="admin-order-returns-list">
        {returns.map((row) => (
          <li key={row.id}>
            <Link href={`/admin/returns/${row.id}`} className="admin-order-return-link">
              <span dir="ltr">{row.id.slice(0, 8)}…</span>
              <Badge variant={statusVariant[row.status] ?? "default"}>
                {statusLabels[row.status] ?? row.status}
              </Badge>
              <span>{formatPrice(row.refundableAmount)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
