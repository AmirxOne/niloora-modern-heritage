import type { Prisma } from "@prisma/client";
import type { CustomizerQuoteRequest, CustomizerQuoteStatus, CustomizerState } from "@/lib/types";

type DbQuote = {
  id: string;
  status: string;
  liveStage: string;
  etaDays: number | null;
  etaUpdatedAt: Date | null;
  workshopLiveMessage: string | null;
  title: string;
  configuration: Prisma.JsonValue;
  estimateTotal: number;
  customerNote: string | null;
  quotedTotal: number | null;
  workshopReply: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toQuoteRequestDto(row: DbQuote): CustomizerQuoteRequest {
  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    status: row.status as CustomizerQuoteStatus,
    liveStage: row.liveStage as CustomizerQuoteRequest["liveStage"],
    etaDays: row.etaDays ?? undefined,
    etaUpdatedAt: row.etaUpdatedAt?.toISOString(),
    workshopLiveMessage: row.workshopLiveMessage ?? undefined,
    title: row.title,
    estimateTotal: row.estimateTotal,
    quotedTotal: row.quotedTotal ?? undefined,
    customerNote: row.customerNote ?? undefined,
    workshopReply: row.workshopReply ?? undefined,
    configuration: row.configuration as unknown as CustomizerState,
    updatedAt: row.updatedAt.toISOString(),
  };
}
