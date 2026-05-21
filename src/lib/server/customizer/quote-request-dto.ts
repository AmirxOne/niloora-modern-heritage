import type { Prisma } from "@prisma/client";
import type { CustomizerQuoteRequest, CustomizerQuoteStatus, CustomizerState } from "@/lib/types";

type DbQuote = {
  id: string;
  status: string;
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
    title: row.title,
    estimateTotal: row.estimateTotal,
    quotedTotal: row.quotedTotal ?? undefined,
    customerNote: row.customerNote ?? undefined,
    workshopReply: row.workshopReply ?? undefined,
    configuration: row.configuration as unknown as CustomizerState,
    updatedAt: row.updatedAt.toISOString(),
  };
}
