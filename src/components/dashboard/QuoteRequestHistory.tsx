"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getShankModel } from "@/lib/customizer/catalog";
import type { CustomizerQuoteRequest, CustomizerQuoteStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/lib/hooks/usePagination";
import { ORDERS_PAGE_SIZE } from "@/lib/pagination";

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
          <dd>{formatPrice(quote.estimateTotal)}</dd>
        </div>
        {quote.quotedTotal != null ? (
          <div>
            <dt>{fa.dashboard.quoteSpecFinal}</dt>
            <dd className="text-gold">{formatPrice(quote.quotedTotal)}</dd>
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
      <div className="order-history-empty">
        <p>{fa.dashboard.quoteEmpty}</p>
        <Link href="/customize">
          <Button variant="outline" size="sm" className="mt-4">
            {fa.dashboard.quoteStartCustomize}
          </Button>
        </Link>
      </div>
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
