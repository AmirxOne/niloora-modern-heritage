"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextAreaBox, TextBox } from "@/components/inputs";
import { Badge } from "@/components/ui/Badge";
import { fa } from "@/lib/i18n/fa";
import { useAdminCustomizerQuotes } from "@/lib/hooks/useAdminCustomizerQuotes";
import type { CustomizerQuoteLiveStage, CustomizerQuoteStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const STATUS_OPTIONS: Array<{ value: CustomizerQuoteStatus; label: string }> = [
  { value: "pending-quote", label: fa.dashboard.quoteStatus.pending_quote },
  { value: "quoted", label: fa.dashboard.quoteStatus.quoted },
  { value: "accepted", label: fa.dashboard.quoteStatus.accepted },
  { value: "rejected", label: fa.dashboard.quoteStatus.rejected },
  { value: "cancelled", label: fa.dashboard.quoteStatus.cancelled },
];

const STAGE_OPTIONS: Array<{ value: CustomizerQuoteLiveStage; label: string }> = [
  { value: "received", label: fa.customize.liveTimeline.stages.received },
  { value: "design-review", label: fa.customize.liveTimeline.stages.designReview },
  { value: "material-prep", label: fa.customize.liveTimeline.stages.materialPrep },
  { value: "workshop-crafting", label: fa.customize.liveTimeline.stages.workshopCrafting },
  { value: "qc", label: fa.customize.liveTimeline.stages.qc },
  { value: "ready-dispatch", label: fa.customize.liveTimeline.stages.readyDispatch },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function QuoteCard({
  item,
  index,
  isSaving,
  onSave,
}: {
  item: ReturnType<typeof useAdminCustomizerQuotes>["quotes"][number];
  index: number;
  isSaving: boolean;
  onSave: ReturnType<typeof useAdminCustomizerQuotes>["updateQuote"];
}) {
  const [status, setStatus] = useState<CustomizerQuoteStatus>(item.status);
  const [stage, setStage] = useState<CustomizerQuoteLiveStage>(item.liveStage);
  const [etaDays, setEtaDays] = useState(item.etaDays ? String(item.etaDays) : "");
  const [liveMessage, setLiveMessage] = useState(item.workshopLiveMessage ?? "");
  const [workshopReply, setWorkshopReply] = useState(item.workshopReply ?? "");
  const [quotedTotal, setQuotedTotal] = useState(item.quotedTotal ? String(item.quotedTotal) : "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      className="admin-order-card"
    >
      <header className="admin-order-card-header">
        <div>
          <p className="admin-order-id">{item.id}</p>
          <p className="admin-order-date">{fmt(item.date)}</p>
          <p className="admin-order-customer">
            {item.userName} · <span dir="ltr">{item.userPhone}</span>
          </p>
        </div>
        <Badge variant="turquoise">{fa.customize.liveTimeline.liveBadge}</Badge>
      </header>

      <div className="admin-order-card-summary flex-col items-start gap-2">
        <p className="text-sm text-ivory">{item.title}</p>
        <span>{formatPrice(item.estimateTotal)}</span>
      </div>

      <div className="admin-order-card-form">
        <SelectBox
          label={fa.customize.liveTimeline.admin.statusLabel}
          value={status}
          options={STATUS_OPTIONS}
          onValueChange={(v) => setStatus(v as CustomizerQuoteStatus)}
          disabled={isSaving}
        />
        <SelectBox
          label={fa.customize.liveTimeline.admin.stageLabel}
          value={stage}
          options={STAGE_OPTIONS}
          onValueChange={(v) => setStage(v as CustomizerQuoteLiveStage)}
          disabled={isSaving}
        />
        <TextBox
          label={fa.customize.liveTimeline.admin.etaLabel}
          value={etaDays}
          onChange={(e) => setEtaDays(e.target.value.replace(/\D/g, ""))}
          inputClassName="auth-input-ltr"
          placeholder="7"
          disabled={isSaving}
        />
        <TextBox
          label={fa.customize.liveTimeline.admin.quotedTotalLabel}
          value={quotedTotal}
          onChange={(e) => setQuotedTotal(e.target.value.replace(/\D/g, ""))}
          inputClassName="auth-input-ltr"
          placeholder="12500000"
          disabled={isSaving}
        />
        <TextAreaBox
          label={fa.customize.liveTimeline.admin.liveMessageLabel}
          value={liveMessage}
          onChange={(e) => setLiveMessage(e.target.value)}
          rows={2}
          disabled={isSaving}
        />
        <TextAreaBox
          label={fa.customize.liveTimeline.admin.replyLabel}
          value={workshopReply}
          onChange={(e) => setWorkshopReply(e.target.value)}
          rows={3}
          disabled={isSaving}
        />
        <Button
          type="button"
          size="sm"
          className="admin-order-save-btn"
          disabled={isSaving}
          onClick={() =>
            void onSave(item.id, {
              status,
              liveStage: stage,
              etaDays: etaDays ? Number(etaDays) : null,
              workshopLiveMessage: liveMessage.trim() || null,
              workshopReply: workshopReply.trim() || null,
              quotedTotal: quotedTotal ? Number(quotedTotal) : null,
            })
          }
        >
          {isSaving ? fa.admin.orders.saving : fa.admin.orders.save}
        </Button>
      </div>
    </motion.article>
  );
}

export function AdminCustomizerQuotesPanel() {
  const admin = useAdminCustomizerQuotes();
  const { allowed, isAdmin, loadQuotes } = admin;

  useEffect(() => {
    if (isAdmin) void loadQuotes();
  }, [isAdmin, loadQuotes]);

  if (!allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <Button type="button" variant="outline" disabled={admin.isLoading} onClick={() => void admin.loadQuotes()}>
          {fa.admin.orders.refresh}
        </Button>
      </div>
      {admin.isLoading ? (
        <LoadingState variant="admin-cards" />
      ) : admin.quotes.length === 0 ? (
        <p className="admin-orders-empty">{fa.customize.liveTimeline.admin.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {admin.quotes.map((item, i) => (
            <QuoteCard key={item.id} item={item} index={i} isSaving={admin.isSaving} onSave={admin.updateQuote} />
          ))}
        </div>
      )}
    </div>
  );
}
