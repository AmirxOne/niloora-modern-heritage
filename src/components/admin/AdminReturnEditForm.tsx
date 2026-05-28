"use client";

import { useEffect, useState } from "react";
import type { AdminOrderReturn, OrderReturnStatus } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";

const t = fa.admin.returns;

const RETURN_STATUSES: OrderReturnStatus[] = [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "refunded",
  "cancelled",
];

const RETURN_REASONS = ["defect", "sizing", "change_mind", "authenticity", "other"] as const;

const statusLabels = t.status as Record<string, string>;
const reasonLabels = t.reason as Record<string, string>;

const statusOptions = RETURN_STATUSES.map((value) => ({
  value,
  label: statusLabels[value] ?? value,
}));

const reasonOptions = RETURN_REASONS.map((value) => ({
  value,
  label: reasonLabels[value] ?? value,
}));

export function AdminReturnEditForm({
  data,
  isSaving,
  onSave,
  showStatusNote = true,
}: {
  data: AdminOrderReturn;
  isSaving: boolean;
  onSave: (payload: {
    status?: OrderReturnStatus;
    statusNote?: string | null;
    internalNotes?: string | null;
    refundableAmount?: number;
    reason?: string;
    reasonDetail?: string | null;
  }) => Promise<unknown>;
  showStatusNote?: boolean;
}) {
  const [status, setStatus] = useState<OrderReturnStatus>(data.status);
  const [reason, setReason] = useState(data.reason);
  const [reasonDetail, setReasonDetail] = useState(data.reasonDetail ?? "");
  const [refundableAmount, setRefundableAmount] = useState(String(data.refundableAmount));
  const [internalNotes, setInternalNotes] = useState(data.internalNotes ?? "");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    setStatus(data.status);
    setReason(data.reason);
    setReasonDetail(data.reasonDetail ?? "");
    setRefundableAmount(String(data.refundableAmount));
    setInternalNotes(data.internalNotes ?? "");
    setStatusNote("");
  }, [data.id, data.status, data.reason, data.reasonDetail, data.refundableAmount, data.internalNotes]);

  const parsedAmount = Number.parseInt(refundableAmount.replace(/\D/g, ""), 10);
  const dirty =
    status !== data.status ||
    reason !== data.reason ||
    (reasonDetail.trim() || "") !== (data.reasonDetail ?? "") ||
    (Number.isFinite(parsedAmount) ? parsedAmount : 0) !== data.refundableAmount ||
    (internalNotes.trim() || "") !== (data.internalNotes ?? "");

  return (
    <div className="admin-order-card-form">
      <SelectBox
        label={t.statusLabel}
        value={status}
        options={statusOptions}
        disabled={isSaving}
        onValueChange={(value) => setStatus(value as OrderReturnStatus)}
      />
      {showStatusNote && status !== data.status ? (
        <TextBox
          label={t.statusNoteLabel}
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          placeholder={t.statusNotePlaceholder}
          disabled={isSaving}
        />
      ) : null}
      <SelectBox
        label={t.reasonLabel}
        value={reason}
        options={reasonOptions}
        disabled={isSaving}
        onValueChange={setReason}
      />
      <TextAreaBox
        label={t.reasonDetailLabel}
        id={`return-reason-${data.id}`}
        value={reasonDetail}
        onChange={(e) => setReasonDetail(e.target.value)}
        disabled={isSaving}
      />
      <TextBox
        label={t.refundableAmountLabel}
        value={refundableAmount}
        onChange={(e) => setRefundableAmount(e.target.value)}
        inputClassName="auth-input-ltr"
        disabled={isSaving}
      />
      <TextAreaBox
        label={t.internalNotesLabel}
        id={`return-notes-${data.id}`}
        value={internalNotes}
        onChange={(e) => setInternalNotes(e.target.value)}
        placeholder={t.internalNotesPlaceholder}
        disabled={isSaving}
      />
      <ul className="admin-return-items-summary sm:col-span-2">
        <li className="text-xs text-gold-dark">{t.itemsLabel}</li>
        {data.items.map((item) => (
          <li key={item.id} className="text-sm text-ivory">
            {item.name} · {item.quantity.toLocaleString("fa-IR")} /{" "}
            {item.orderQuantity.toLocaleString("fa-IR")}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        className="admin-order-save-btn"
        disabled={!dirty || isSaving}
        onClick={() =>
          void onSave({
            ...(status !== data.status ? { status, statusNote: statusNote.trim() || null } : {}),
            ...(reason !== data.reason ? { reason } : {}),
            ...(reasonDetail.trim() !== (data.reasonDetail ?? "")
              ? { reasonDetail: reasonDetail.trim() || null }
              : {}),
            ...(Number.isFinite(parsedAmount) && parsedAmount !== data.refundableAmount
              ? { refundableAmount: parsedAmount }
              : {}),
            ...(internalNotes.trim() !== (data.internalNotes ?? "")
              ? { internalNotes: internalNotes.trim() || null }
              : {}),
          })
        }
      >
        {isSaving ? t.saving : t.save}
      </Button>
    </div>
  );
}
