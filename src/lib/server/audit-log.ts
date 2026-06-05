import { promises as fs } from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import type { AdminAuditLogQuery, AuditLogEntry } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import { toAuditLogEntryDto } from "@/lib/server/audit-log/admin-audit-log-dto";

type AdminUserLite = {
  id: string;
  name?: string | null;
  phone?: string | null;
  role?: string | null;
};

const LEGACY_STORE_DIR = path.join(process.cwd(), "data", "audit");
const LEGACY_STORE_FILE = path.join(LEGACY_STORE_DIR, "admin-audit.jsonl");

let legacyImportStarted = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toPayloadText(value: unknown): string | undefined {
  if (value == null) return undefined;
  try {
    const json = JSON.stringify(value);
    if (!json) return undefined;
    return json.length > 2000 ? `${json.slice(0, 2000)}…` : json;
  } catch {
    return undefined;
  }
}

function requestIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

function requestUserAgent(request?: Request): string | undefined {
  return request?.headers.get("user-agent")?.trim() || undefined;
}

function parseLegacyEntry(line: string): AuditLogEntry | null {
  try {
    return JSON.parse(line) as AuditLogEntry;
  } catch {
    return null;
  }
}

async function readLegacyJsonlEntries(): Promise<AuditLogEntry[]> {
  try {
    const raw = await fs.readFile(LEGACY_STORE_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseLegacyEntry)
      .filter((entry): entry is AuditLogEntry => entry != null);
  } catch {
    return [];
  }
}

async function importLegacyJsonlIfNeeded(): Promise<void> {
  if (legacyImportStarted) return;
  legacyImportStarted = true;

  const existingCount = await prisma.adminAuditLog.count();
  if (existingCount > 0) return;

  const legacyEntries = await readLegacyJsonlEntries();
  if (legacyEntries.length === 0) return;

  await prisma.adminAuditLog.createMany({
    data: legacyEntries.map((entry) => ({
      id: entry.id,
      createdAt: new Date(entry.at),
      action: entry.action,
      method: entry.method,
      route: entry.route,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      summary: entry.summary ?? null,
      payload: entry.payload ?? null,
      actorId: entry.actorId,
      actorName: entry.actorName ?? null,
      actorPhone: entry.actorPhone ?? null,
      actorRole: entry.actorRole ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    })),
    skipDuplicates: true,
  });
}

function buildWhere(input: AdminAuditLogQuery): Prisma.AdminAuditLogWhereInput {
  const where: Prisma.AdminAuditLogWhereInput = {};

  if (input.action?.trim()) where.action = input.action.trim();
  if (input.entityType?.trim()) where.entityType = input.entityType.trim();
  if (input.actorId?.trim()) where.actorId = input.actorId.trim();

  const fromTs = input.from ? Date.parse(input.from) : NaN;
  const toTs = input.to ? Date.parse(input.to) : NaN;
  if (!Number.isNaN(fromTs) || !Number.isNaN(toTs)) {
    where.createdAt = {
      ...(!Number.isNaN(fromTs) ? { gte: new Date(fromTs) } : {}),
      ...(!Number.isNaN(toTs) ? { lte: new Date(toTs) } : {}),
    };
  }

  const q = input.q?.trim();
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { route: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { payload: { contains: q, mode: "insensitive" } },
      { actorId: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { actorPhone: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function writeAdminAuditLog(input: {
  user: AdminUserLite | null | undefined;
  action: string;
  method?: string;
  route?: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  payload?: unknown;
  request?: Request;
}) {
  await importLegacyJsonlIfNeeded();

  const id = generateId();
  await prisma.adminAuditLog.create({
    data: {
      id,
      action: input.action,
      method: input.method ?? (input.request?.method || "UNKNOWN"),
      route:
        input.route ??
        (input.request ? new URL(input.request.url).pathname : "/api/admin/unknown"),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary ?? null,
      payload: toPayloadText(input.payload) ?? null,
      actorId: input.user?.id ?? "unknown-admin",
      actorName: input.user?.name ?? null,
      actorPhone: input.user?.phone ?? null,
      actorRole: input.user?.role ?? null,
      ip: requestIp(input.request) ?? null,
      userAgent: requestUserAgent(input.request) ?? null,
    },
  });
}

export async function queryAdminAuditLogs(
  input: AdminAuditLogQuery
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  await importLegacyJsonlIfNeeded();

  const where = buildWhere(input);
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 2000);

  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return {
    logs: rows.map(toAuditLogEntryDto),
    total,
  };
}

export type { AuditLogEntry };
