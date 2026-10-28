"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAdminSellers, type AdminSellerRecord } from "@/lib/hooks/useAdminSellers";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const t = fa.admin.sellers;

function statusVariant(status: AdminSellerRecord["status"]): "gold" | "turquoise" | "default" {
  if (status === "active") return "turquoise";
  if (status === "suspended") return "default";
  return "gold";
}

function SellerCard({
  seller,
  index,
  isSaving,
  onUpdate,
}: {
  seller: AdminSellerRecord;
  index: number;
  isSaving: boolean;
  onUpdate: (id: string, patch: { status?: string; commissionPercent?: number }) => void;
}) {
  const [commission, setCommission] = useState(String(seller.commissionPercent));

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="rounded-heritage-lg border border-[#F0EDE9] bg-white p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ivory">{seller.shopName}</p>
          <p className="mt-1 font-mono text-xs text-silver" dir="ltr">/{seller.slug}</p>
          <p className="mt-1 text-xs text-silver">
            {t.owner}: {seller.owner.name} · <span dir="ltr">{seller.owner.phone}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={statusVariant(seller.status)}>{t.status[seller.status]}</Badge>
          <span className="text-xs text-silver">{t.productCount(seller.productCount)}</span>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-xs text-silver">
          {t.commission}
          <input
            className="w-16 rounded border border-[#E5E0DA] px-2 py-1 text-sm text-ivory"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            inputMode="numeric"
            dir="ltr"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving || Number(commission) === seller.commissionPercent}
            onClick={() => void onUpdate(seller.id, { commissionPercent: Number(commission) })}
          >
            {isSaving ? t.saving : t.saveCommission}
          </Button>
        </label>

        <div className="flex gap-2">
          {seller.status !== "active" ? (
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={() => void onUpdate(seller.id, { status: "active" })}
            >
              {t.activate}
            </Button>
          ) : null}
          {seller.status === "active" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() => void onUpdate(seller.id, { status: "suspended" })}
            >
              {t.suspend}
            </Button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export function AdminSellersPanel() {
  const admin = useAdminSellers();

  if (!admin.isAdmin) {
    return (
      <div className="py-16 text-center">
        <p className="text-ivory">{fa.admin.forbidden}</p>
      </div>
    );
  }

  const pendingPayouts = admin.payouts.filter(
    (p) => p.status === "requested" || p.status === "approved"
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-labelledby="admin-sellers-heading">
        <div className="flex items-center justify-between">
          <h2 id="admin-sellers-heading" className="font-display text-xl text-ivory">
            {t.title}
          </h2>
          <Button type="button" variant="outline" size="sm" disabled={admin.isLoading} onClick={() => void admin.load()}>
            {t.refresh}
          </Button>
        </div>

        {admin.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="sk h-32 rounded-heritage-lg" />
            ))}
          </div>
        ) : admin.sellers.length === 0 ? (
          <p className="py-10 text-center text-sm text-silver">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {admin.sellers.map((s, i) => (
              <SellerCard
                key={s.id}
                seller={s}
                index={i}
                isSaving={admin.isSaving}
                onUpdate={(id, patch) => void admin.updateSeller(id, patch)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="admin-payouts-heading">
        <h2 id="admin-payouts-heading" className="font-display text-xl text-ivory">
          {t.payoutsTitle}
        </h2>
        {admin.payouts.length === 0 ? (
          <p className="py-6 text-center text-sm text-silver">{t.noPayouts}</p>
        ) : (
          <ul className="space-y-2">
            {admin.payouts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-heritage-lg border border-[#F0EDE9] bg-white p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-ivory">{p.seller.shopName}</p>
                  <p className="mt-1 text-xs text-silver">
                    {formatPrice(p.amount)} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "paid" ? "default" : "gold"}>
                    {t.payoutStatus[p.status]}
                  </Badge>
                  {p.status === "requested" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={admin.isSaving}
                        onClick={() => void admin.payoutAction(p.id, "approve")}
                      >
                        {t.approvePayout}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={admin.isSaving}
                        onClick={() => void admin.payoutAction(p.id, "reject")}
                      >
                        {t.rejectPayout}
                      </Button>
                    </>
                  ) : null}
                  {p.status === "approved" || (p.status === "requested" && false) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={admin.isSaving}
                      onClick={() => void admin.payoutAction(p.id, "mark_paid")}
                    >
                      {t.markPaid}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {pendingPayouts.length > 0 ? (
          <p className="text-xs text-silver">
            {pendingPayouts.length.toLocaleString("fa-IR")} درخواست در انتظار اقدام
          </p>
        ) : null}
      </section>
    </div>
  );
}
