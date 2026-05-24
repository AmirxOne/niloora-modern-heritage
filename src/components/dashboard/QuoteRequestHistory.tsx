"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getShankModel } from "@/lib/customizer/catalog";
import type { CustomizerQuoteRequest, CustomizerQuoteStatus } from "@/lib/types";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { ORDERS_PAGE_SIZE } from "@/lib/pagination";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";

const statusLabels: Record<CustomizerQuoteStatus, string> = {
  "pending-quote": fa.dashboard.quoteStatus.pending_quote,
  quoted: fa.dashboard.quoteStatus.quoted,
  accepted: fa.dashboard.quoteStatus.accepted,
  rejected: fa.dashboard.quoteStatus.rejected,
  cancelled: fa.dashboard.quoteStatus.cancelled,
};

const statusVariant: Record<
  CustomizerQuoteStatus,
  "gold" | "turquoise" | "royal" | "default"
> = {
  "pending-quote": "gold",
  quoted: "turquoise",
  accepted: "royal",
  rejected: "default",
  cancelled: "default",
};

const liveStages: Array<CustomizerQuoteRequest["liveStage"]> = [
  "received",
  "design-review",
  "material-prep",
  "workshop-crafting",
  "qc",
  "ready-dispatch",
];

function formatQuoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function QuoteCard({ quote, index }: { quote: CustomizerQuoteRequest; index: number }) {
  const shank = getShankModel(quote.configuration.shankModelId);

  const currentStageIndex = Math.max(0, liveStages.indexOf(quote.liveStage));
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      className="order-history-card quote-request-card"
    >
      <header className="order-history-card-header">
        <div>
          <p className="order-history-id">{quote.id}</p>
          <p className="order-history-date">{formatQuoteDate(quote.date)}</p>
        </div>
        <Badge variant={statusVariant[quote.status]}>{statusLabels[quote.status]}</Badge>
      </header>

      <h3 className="quote-request-title">{quote.title}</h3>

      <dl className="quote-request-specs">
        <div>
          <dt>{fa.dashboard.quoteSpecShank}</dt>
          <dd>{shank?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>{fa.dashboard.quoteSpecEstimate}</dt>
          <dd><TomanPrice amount={quote.estimateTotal} size="xs" /></dd>
        </div>
        {quote.quotedTotal != null ? (
          <div>
            <dt>{fa.dashboard.quoteSpecFinal}</dt>
            <dd><TomanPrice amount={quote.quotedTotal} size="xs" /></dd>
          </div>
        ) : null}
      </dl>

      {quote.customerNote ? (
        <p className="quote-request-note">
          <span className="quote-request-note-label">{fa.dashboard.quoteCustomerNote}:</span>{" "}
          {quote.customerNote}
        </p>
      ) : null}

      {quote.workshopReply ? (
        <p className="quote-request-reply">{quote.workshopReply}</p>
      ) : null}

      <section className="quote-live-timeline" aria-label={fa.customize.liveTimeline.title}>
        <header className="quote-live-timeline-head">
          <p className="quote-live-timeline-title">{fa.customize.liveTimeline.title}</p>
          <Badge variant="turquoise">{fa.customize.liveTimeline.liveBadge}</Badge>
        </header>
        <ol className="quote-live-timeline-steps">
          {liveStages.map((stage, idx) => (
            <li
              key={stage}
              className={`quote-live-timeline-step ${
                idx <= currentStageIndex
                  ? idx === currentStageIndex
                    ? "is-current"
                    : "is-done"
                  : "is-upcoming"
              }`}
            >
              <span>{fa.customize.liveTimeline.stages[stageToFaKey(stage)]}</span>
            </li>
          ))}
        </ol>
        <div className="quote-live-timeline-meta">
          <span>
            {fa.customize.liveTimeline.etaPrefix}:{" "}
            {quote.etaDays ? fa.customize.liveTimeline.etaDays(quote.etaDays) : fa.customize.liveTimeline.etaPending}
          </span>
          {quote.etaUpdatedAt ? (
            <span>{fa.customize.liveTimeline.etaUpdatedAt(formatQuoteDate(quote.etaUpdatedAt))}</span>
          ) : null}
        </div>
        {quote.workshopLiveMessage ? (
          <p className="quote-live-timeline-message">{quote.workshopLiveMessage}</p>
        ) : (
          <p className="quote-live-timeline-message quote-live-timeline-message--muted">
            {fa.customize.liveTimeline.waitingMessage}
          </p>
        )}
      </section>

      {quote.status === "pending-quote" ? (
        <p className="quote-request-hint">{fa.dashboard.quotePendingHint}</p>
      ) : null}

      <footer className="quote-request-footer">
        <Link href={`/customize?design=${encodeConfig(quote.configuration)}`}>
          <Button type="button" variant="outline" size="sm">
            {fa.dashboard.quoteViewConfig}
          </Button>
        </Link>
      </footer>
    </motion.article>
  );
}

function stageToFaKey(stage: CustomizerQuoteRequest["liveStage"]) {
  switch (stage) {
    case "received":
      return "received";
    case "design-review":
      return "designReview";
    case "material-prep":
      return "materialPrep";
    case "workshop-crafting":
      return "workshopCrafting";
    case "qc":
      return "qc";
    case "ready-dispatch":
      return "readyDispatch";
    default:
      return "received";
  }
}

function encodeConfig(configuration: CustomizerQuoteRequest["configuration"]): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(configuration))));
  } catch {
    return "";
  }
}

export function QuoteRequestHistory({
  quotes,
  isLoading,
}: {
  quotes: CustomizerQuoteRequest[];
  isLoading: boolean;
}) {
  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    from,
    to,
    totalItems,
  } = usePagination(quotes, ORDERS_PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="order-history-loading" aria-busy="true">
        <p className="text-silver">{fa.common.loading}</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <UnifiedEmptyState
        visual="orders"
        title={fa.dashboard.quoteEmpty}
        className="order-history-empty"
        action={
          <Link href="/customize">
            <Button variant="outline" size="sm">
              {fa.dashboard.quoteStartCustomize}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="order-history">
      <ul className="order-history-list">
        {paginatedItems.map((quote, index) => (
          <li key={quote.id}>
            <QuoteCard quote={quote} index={index} />
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        from={from}
        to={to}
        scrollTargetId="workshop-quotes"
        className="order-history-pagination"
      />
    </div>
  );
}
