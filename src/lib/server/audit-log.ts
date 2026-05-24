import { promises as fs } from "node:fs";
import path from "node:path";

type AdminUserLite = {
  id: string;
  name?: string | null;
  phone?: string | null;
  role?: string | null;
};

export type AuditLogEntry = {
  id: string;
  at: string;
  action: string;
  method: string;
  route: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  payload?: string;
  actorId: string;
  actorName?: string | null;
  actorPhone?: string | null;
  actorRole?: string | null;
  ip?: string;
  userAgent?: string;
};

type QueryInput = {
  q?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

const STORE_DIR = path.join(process.cwd(), "data", "audit");
const STORE_FILE = path.join(STORE_DIR, "admin-audit.jsonl");

async function ensureStore() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

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
  await ensureStore();
  const entry: AuditLogEntry = {
    id: generateId(),
    at: new Date().toISOString(),
    action: input.action,
    method: input.method ?? (input.request?.method || "UNKNOWN"),
    route:
      input.route ??
      (input.request ? new URL(input.request.url).pathname : "/api/admin/unknown"),
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    payload: toPayloadText(input.payload),
    actorId: input.user?.id ?? "unknown-admin",
    actorName: input.user?.name ?? null,
    actorPhone: input.user?.phone ?? null,
    actorRole: input.user?.role ?? null,
    ip: requestIp(input.request),
    userAgent: requestUserAgent(input.request),
  };
  await fs.appendFile(STORE_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

async function readAllEntries(): Promise<AuditLogEntry[]> {
  await ensureStore();
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    const entries: AuditLogEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as AuditLogEntry);
      } catch {
        // ignore corrupt line
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export async function queryAdminAuditLogs(input: QueryInput): Promise<AuditLogEntry[]> {
  const entries = await readAllEntries();
  const q = input.q?.trim().toLowerCase();
  const fromTs = input.from ? Date.parse(input.from) : NaN;
  const toTs = input.to ? Date.parse(input.to) : NaN;

  const filtered = entries.filter((entry) => {
    if (input.action && entry.action !== input.action) return false;
    if (input.entityType && entry.entityType !== input.entityType) return false;
    if (input.actorId && entry.actorId !== input.actorId) return false;

    const atTs = Date.parse(entry.at);
    if (!Number.isNaN(fromTs) && atTs < fromTs) return false;
    if (!Number.isNaN(toTs) && atTs > toTs) return false;

    if (q) {
      const hay = [
        entry.action,
        entry.route,
        entry.entityType,
        entry.entityId,
        entry.summary,
        entry.payload,
        entry.actorId,
        entry.actorName,
        entry.actorPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 2000);
  return sorted.slice(0, limit);
}
