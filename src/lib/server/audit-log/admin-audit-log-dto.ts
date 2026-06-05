import type { AdminAuditLog } from "@prisma/client";
import type { AuditLogEntry } from "@/lib/types";

export function toAuditLogEntryDto(row: AdminAuditLog): AuditLogEntry {
  return {
    id: row.id,
    at: row.createdAt.toISOString(),
    action: row.action,
    method: row.method,
    route: row.route,
    entityType: row.entityType ?? undefined,
    entityId: row.entityId ?? undefined,
    summary: row.summary ?? undefined,
    payload: row.payload ?? undefined,
    actorId: row.actorId,
    actorName: row.actorName,
    actorPhone: row.actorPhone,
    actorRole: row.actorRole,
    ip: row.ip ?? undefined,
    userAgent: row.userAgent ?? undefined,
  };
}
