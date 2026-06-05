import type { AdminSupportRequest, OrderReturnStatus } from "@/lib/types";
import { resolveUnifiedReturnStatus } from "@/lib/returns/workflow";
import type { SupportRequestKind, SupportRequestStatus } from "./support-request";

type SupportRequestRow = {
  id: string;
  userId: string | null;
  orderId: string | null;
  kind: string;
  category: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string;
  internalNotes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  orderReturn?: { id: string; status: string } | null;
};

export function toAdminSupportRequestDto(row: SupportRequestRow): AdminSupportRequest {
  const orderReturnStatus = row.orderReturn?.status as OrderReturnStatus | undefined;
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
    orderReturnId: row.orderReturn?.id,
    orderReturnStatus,
    unifiedStatus: resolveUnifiedReturnStatus({
      returnStatus: orderReturnStatus ?? null,
      supportStatus: row.status as SupportRequestStatus,
    }),
  };
}
