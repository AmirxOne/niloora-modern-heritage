import type { SupportRequest as PrismaSupportRequest } from "@prisma/client";
import type { AdminSupportRequest } from "@/lib/types";
import type { SupportRequestKind, SupportRequestStatus } from "./support-request";

export function toAdminSupportRequestDto(row: PrismaSupportRequest): AdminSupportRequest {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    orderId: row.orderId ?? undefined,
    kind: row.kind as SupportRequestKind,
    category: row.category,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email ?? undefined,
    message: row.message,
    internalNotes: row.internalNotes ?? undefined,
    status: row.status as SupportRequestStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
