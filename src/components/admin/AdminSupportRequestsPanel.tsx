"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  SUPPORT_REQUEST_FILTER_KINDS,
  SUPPORT_REQUEST_FILTER_STATUSES,
  SUPPORT_REQUEST_STATUSES,
  type SupportRequestKind,
  type SupportRequestStatus,
} from "@/lib/server/support-request/support-request";
import type { AdminSupportRequest } from "@/lib/types";
import { useAdminSupportRequests } from "@/lib/hooks/useAdminSupportRequests";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextAreaBox } from "@/components/inputs";

const t = fa.admin.supportRequests;

const statusLabels: Record<SupportRequestStatus, string> = {
  pending: t.status.pending,
  in_progress: t.status.in_progress,
  resolved: t.status.resolved,
  rejected: t.status.rejected,
};

const kindLabels: Record<SupportRequestKind, string> = {
  return: t.kind.return,
  support: t.kind.support,
};

const statusVariant: Record<SupportRequestStatus, "gold" | "turquoise" | "default"> = {
  pending: "gold",
  in_progress: "turquoise",
  resolved: "default",
  rejected: "default",
};

const statusFilterOptions = SUPPORT_REQUEST_FILTER_STATUSES.map((value) => ({
  value,
  label: value === "all" ? t.filterAll : statusLabels[value as SupportRequestStatus],
}));

const kindFilterOptions = SUPPORT_REQUEST_FILTER_KINDS.map((value) => ({
  value,
  label: value === "all" ? t.filterAll : kindLabels[value as SupportRequestKind],
}));

const statusOptions = SUPPORT_REQUEST_STATUSES.map((value) => ({
  value,
  label: statusLabels[value],
}));

function categoryLabel(kind: SupportRequestKind, category: string): string {
  if (kind === "return") {
    const map = t.returnCategory as Record<string, string>;
    return map[category] ?? category;
  }
  const map = t.supportCategory as Record<string, string>;
  return map[category] ?? category;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminSupportRequestCard({
  request,
  index,
  isSaving,
  onSave,
}: {
  request: AdminSupportRequest;
  index: number;
  isSaving: boolean;
  onSave: (
    id: string,
    payload: { status?: SupportRequestStatus; internalNotes?: string | null }
  ) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<SupportRequestStatus>(request.status);
  const [internalNotes, setInternalNotes] = useState(request.internalNotes ?? "");

  useEffect(() => {
    setStatus(request.status);
    setInternalNotes(request.internalNotes ?? "");
  }, [request.id, request.status, request.internalNotes]);

  const dirty =
    status !== request.status ||
    (internalNotes.trim() || "") !== (request.internalNotes ?? "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{request.id}</p>
          <p className="admin-order-date">{formatDate(request.createdAt)}</p>
          <p className="admin-order-customer">
            {request.fullName} · <span dir="ltr">{request.phone}</span>
          </p>
          {request.email ? (
            <p className="text-xs text-silver" dir="ltr">
              {request.email}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="royal">{kindLabels[request.kind]}</Badge>
          <Badge variant={statusVariant[request.status]}>{statusLabels[request.status]}</Badge>
        </div>
      </header>

      <div className="admin-order-card-summary flex-col items-start gap-2">
        <span className="text-xs text-gold-dark">{categoryLabel(request.kind, request.category)}</span>
        {request.orderId ? (
          <span className="font-mono text-sm text-ivory" dir="ltr">
            {t.orderId}: {request.orderId}
          </span>
        ) : null}
        <p className="text-sm leading-relaxed text-ivory-light whitespace-pre-wrap">
          {request.message}
        </p>
      </div>

      <div className="admin-order-card-form">
        <SelectBox
          label={t.statusLabel}
          value={status}
          options={statusOptions}
          onValueChange={(value) => setStatus(value as SupportRequestStatus)}
        />
        <TextAreaBox
          label={t.internalNotesLabel}
          id={`support-notes-${request.id}`}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder={t.internalNotesPlaceholder}
        />
        <Button
          type="button"
          size="sm"
          className="admin-order-save-btn"
          variant="turquoise"
          disabled={!dirty || isSaving}
          onClick={() =>
            void onSave(request.id, {
              ...(status !== request.status ? { status } : {}),
              internalNotes: internalNotes.trim() || null,
            })
          }
        >
          {isSaving ? t.saving : t.save}
        </Button>
      </div>
    </motion.article>
  );
}

export function AdminSupportRequestsPanel() {
  const admin = useAdminSupportRequests();

  useEffect(() => {
    if (admin.isAdmin) {
      void admin.loadRequests(admin.statusFilter, admin.kindFilter);
    }
  }, [admin.isAdmin, admin.statusFilter, admin.kindFilter, admin.loadRequests]);

  const sorted = useMemo(
    () =>
      [...admin.requests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [admin.requests]
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
      <div className="admin-orders-toolbar flex-wrap">
        <SelectBox
          label={t.filterStatusLabel}
          value={admin.statusFilter}
          options={statusFilterOptions}
          onValueChange={(value) => admin.setStatusFilter(value as typeof admin.statusFilter)}
        />
        <SelectBox
          label={t.filterKindLabel}
          value={admin.kindFilter}
          options={kindFilterOptions}
          onValueChange={(value) => admin.setKindFilter(value as typeof admin.kindFilter)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadRequests(admin.statusFilter, admin.kindFilter)}
        >
          {t.refresh}
        </Button>
      </div>

      {admin.isLoading ? (
        <p className="text-silver" aria-busy="true">
          {t.loading}
        </p>
      ) : sorted.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {sorted.map((request, i) => (
            <AdminSupportRequestCard
              key={request.id}
              request={request}
              index={i}
              isSaving={admin.isSaving}
              onSave={admin.updateRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
