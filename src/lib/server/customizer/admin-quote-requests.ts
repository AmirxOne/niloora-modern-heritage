import { prisma } from "@/lib/server/prisma";
import { toQuoteRequestDto } from "@/lib/server/customizer/quote-request-dto";
import type { CustomizerQuoteLiveStage, CustomizerQuoteRequest, CustomizerQuoteStatus } from "@/lib/types";

export const ADMIN_CUSTOMIZER_QUOTE_STATUSES: CustomizerQuoteStatus[] = [
  "pending-quote",
  "quoted",
  "accepted",
  "rejected",
  "cancelled",
];

export const ADMIN_CUSTOMIZER_QUOTE_STAGES: CustomizerQuoteLiveStage[] = [
  "received",
  "design-review",
  "material-prep",
  "workshop-crafting",
  "qc",
  "ready-dispatch",
];

export type AdminCustomizerQuote = CustomizerQuoteRequest & {
  userName: string;
  userPhone: string;
};

export function isCustomizerQuoteStatus(value: string): value is CustomizerQuoteStatus {
  return ADMIN_CUSTOMIZER_QUOTE_STATUSES.includes(value as CustomizerQuoteStatus);
}

export function isCustomizerQuoteStage(value: string): value is CustomizerQuoteLiveStage {
  return ADMIN_CUSTOMIZER_QUOTE_STAGES.includes(value as CustomizerQuoteLiveStage);
}

export async function listAdminCustomizerQuotes(): Promise<AdminCustomizerQuote[]> {
  const rows = await prisma.customizerQuoteRequest.findMany({
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return rows.map((row) => ({
    ...toQuoteRequestDto(row),
    userName: row.user.name,
    userPhone: row.user.phone,
  }));
}

export async function updateAdminCustomizerQuote(
  id: string,
  payload: {
    status?: CustomizerQuoteStatus;
    liveStage?: CustomizerQuoteLiveStage;
    etaDays?: number | null;
    workshopLiveMessage?: string | null;
    workshopReply?: string | null;
    quotedTotal?: number | null;
  }
): Promise<AdminCustomizerQuote | null> {
  const updated = await prisma.customizerQuoteRequest.update({
    where: { id },
    data: {
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.liveStage ? { liveStage: payload.liveStage } : {}),
      ...(payload.etaDays !== undefined ? { etaDays: payload.etaDays } : {}),
      ...(payload.etaDays !== undefined ? { etaUpdatedAt: payload.etaDays == null ? null : new Date() } : {}),
      ...(payload.workshopLiveMessage !== undefined
        ? { workshopLiveMessage: payload.workshopLiveMessage }
        : {}),
      ...(payload.workshopReply !== undefined ? { workshopReply: payload.workshopReply } : {}),
      ...(payload.quotedTotal !== undefined ? { quotedTotal: payload.quotedTotal } : {}),
    },
    include: { user: { select: { name: true, phone: true } } },
  });

  if (!updated) return null;
  return {
    ...toQuoteRequestDto(updated),
    userName: updated.user.name,
    userPhone: updated.user.phone,
  };
}
