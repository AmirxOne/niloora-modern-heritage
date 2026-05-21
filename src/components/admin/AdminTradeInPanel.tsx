"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TRADE_IN_FILTER_STATUSES,
  TRADE_IN_STATUSES,
  type TradeInSubmissionStatus,
} from "@/lib/server/trade-in/admin-trade-in";
import type { AdminTradeInSubmission } from "@/lib/types";
import { useAdminTradeIn } from "@/lib/hooks/useAdminTradeIn";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextAreaBox } from "@/components/inputs";

const statusLabels: Record<TradeInSubmissionStatus, string> = {
  pending: fa.admin.tradeIn.status.pending,
  reviewed: fa.admin.tradeIn.status.reviewed,
  rejected: fa.admin.tradeIn.status.rejected,
};

const statusVariant: Record<TradeInSubmissionStatus, "gold" | "turquoise" | "default"> = {
  pending: "gold",
  reviewed: "turquoise",
  rejected: "default",
};

const filterOptions = TRADE_IN_FILTER_STATUSES.map((value) => ({
  value,
  label:
    value === "all"
      ? fa.admin.tradeIn.filterAll
      : statusLabels[value as TradeInSubmissionStatus] ?? value,
}));

const statusOptions = TRADE_IN_STATUSES.map((value) => ({
  value,
  label: statusLabels[value],
}));

function formatSubmissionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminTradeInCard({
  submission,
  index,
  isSaving,
  onSave,
}: {
  submission: AdminTradeInSubmission;
  index: number;
  isSaving: boolean;
  onSave: (
    id: string,
    payload: { status?: TradeInSubmissionStatus; internalNotes?: string | null }
  ) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<TradeInSubmissionStatus>(submission.status);
  const [internalNotes, setInternalNotes] = useState(submission.internalNotes ?? "");

  useEffect(() => {
    setStatus(submission.status);
    setInternalNotes(submission.internalNotes ?? "");
  }, [submission.id, submission.status, submission.internalNotes]);

  const dirty =
    status !== submission.status ||
    (internalNotes.trim() || "") !== (submission.internalNotes ?? "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{submission.id}</p>
          <p className="admin-order-date">{formatSubmissionDate(submission.createdAt)}</p>
          <p className="admin-order-customer">
            {submission.fullName} · <span dir="ltr">{submission.phone}</span>
          </p>
        </div>
        <Badge variant={statusVariant[submission.status]}>
          {statusLabels[submission.status]}
        </Badge>
      </header>

      <div className="admin-order-card-summary flex-col items-start gap-2">
        <p className="text-sm text-ivory-light">{submission.ringDescription}</p>
        <span>
          {fa.admin.tradeIn.estimatedPrice}: {formatPrice(submission.estimatedOriginalPrice)}
        </span>
        {submission.wantsRemake ? (
          <span className="text-xs text-turquoise-dark">{fa.admin.tradeIn.wantsRemake}</span>
        ) : (
          <span className="text-xs text-silver">{fa.admin.tradeIn.sellOnly}</span>
        )}
        {submission.notes ? (
          <p className="text-xs text-silver">
            <span className="font-medium text-ivory-light">{fa.admin.tradeIn.customerNotes}: </span>
            {submission.notes}
          </p>
        ) : null}
      </div>

      <div className="admin-order-card-form">
        <SelectBox
          label={fa.admin.tradeIn.statusLabel}
          value={status}
          options={statusOptions}
          disabled={isSaving}
          onValueChange={(value) => setStatus(value as TradeInSubmissionStatus)}
        />
        <TextAreaBox
          label={fa.admin.tradeIn.internalNotesLabel}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          disabled={isSaving}
          rows={3}
          placeholder={fa.admin.tradeIn.internalNotesPlaceholder}
        />
        <Button
          type="button"
          size="sm"
          className="admin-order-save-btn"
          disabled={!dirty || isSaving}
          onClick={() =>
            void onSave(submission.id, {
              ...(status !== submission.status ? { status } : {}),
              internalNotes: internalNotes.trim() || null,
            })
          }
        >
          {isSaving ? fa.admin.tradeIn.saving : fa.admin.tradeIn.save}
        </Button>
      </div>
    </motion.article>
  );
}

export function AdminTradeInPanel() {
  const admin = useAdminTradeIn();

  useEffect(() => {
    if (admin.isAdmin) {
      void admin.loadSubmissions(admin.statusFilter);
    }
  }, [admin.isAdmin, admin.statusFilter, admin.loadSubmissions]);

  const sorted = useMemo(
    () =>
      [...admin.submissions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [admin.submissions]
  );

  if (!admin.isAdmin) {
    return (
      <div className="admin-orders-forbidden">
        <p className="text-ivory">{fa.admin.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <SelectBox
          label={fa.admin.tradeIn.filterLabel}
          value={admin.statusFilter}
          options={filterOptions}
          onValueChange={(value) => {
            admin.setStatusFilter(value as typeof admin.statusFilter);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadSubmissions(admin.statusFilter)}
        >
          {fa.admin.tradeIn.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <p className="text-silver" aria-busy="true">
          {fa.admin.tradeIn.loading}
        </p>
      ) : sorted.length === 0 ? (
        <p className="admin-orders-empty">{fa.admin.tradeIn.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {sorted.map((submission, i) => (
            <AdminTradeInCard
              key={submission.id}
              submission={submission}
              index={i}
              isSaving={admin.isSaving}
              onSave={admin.updateSubmission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
