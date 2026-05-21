import type { TradeInSubmission as PrismaTradeIn } from "@prisma/client";
import type { AdminTradeInSubmission } from "@/lib/types";

export function toAdminTradeInDto(row: PrismaTradeIn): AdminTradeInSubmission {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    ringDescription: row.ringDescription,
    estimatedOriginalPrice: row.estimatedOriginalPrice,
    notes: row.notes ?? undefined,
    internalNotes: row.internalNotes ?? undefined,
    wantsRemake: row.wantsRemake,
    status: row.status as AdminTradeInSubmission["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
